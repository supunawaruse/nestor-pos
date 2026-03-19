const express = require('express');
const cors = require('cors');
const db = require('./db');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for PDF base64

// Helper function to get or create brand/category ID
const ensureEntity = async (table, name) => {
  if (!name) return null;
  const { rows } = await db.query(
    `INSERT INTO ${table} (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
    [name]
  );
  return rows[0].id;
};

// --- BRANDS ---
app.get('/api/brands', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM brands ORDER BY name ASC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

app.post('/api/brands', async (req, res) => {
  const { name } = req.body;
  try {
    const { rows } = await db.query('INSERT INTO brands (name) VALUES ($1) RETURNING *', [name]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

// --- CATEGORIES ---
app.get('/api/categories', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

app.post('/api/categories', async (req, res) => {
  const { name } = req.body;
  try {
    const { rows } = await db.query('INSERT INTO categories (name) VALUES ($1) RETURNING *', [name]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

// Get all products (with pagination and filtering)
app.get('/api/products', async (req, res) => {
  let { page = 1, limit = 10, all = false, brand = 'All', category = 'All', search = '' } = req.query;
  
  try {
    let whereClauses = [];
    let params = [];

    if (brand !== 'All') {
      whereClauses.push(`b.name = $${params.length + 1}`);
      params.push(brand);
    }
    if (category !== 'All') {
      whereClauses.push(`c.name = $${params.length + 1}`);
      params.push(category);
    }
    if (search.trim()) {
      whereClauses.push(`(p.name ILIKE $${params.length + 1} OR p.barcode ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const baseQuery = `
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereStr}
    `;

    // 1. Get total count for these specific filters
    const countResult = await db.query(`SELECT COUNT(*) ${baseQuery}`, params);
    const total = parseInt(countResult.rows[0].count);

    // 2. Decide if we return ALL (for POS) OR paginated (for Inventory)
    if (String(all) === 'true') {
      const { rows } = await db.query(`
        SELECT p.*, b.name as brand, c.name as category 
        ${baseQuery} 
        ORDER BY p.name ASC`, params);
      return res.json(rows);
    }

    const offset = (Number(page) - 1) * Number(limit);
    const paginatedParams = [...params, Number(limit), offset];

    // 3. Get paginated, filtered data
    const { rows } = await db.query(`
      SELECT p.*, p.cost_price as buying_price, b.name as brand, c.name as category 
      ${baseQuery} 
      ORDER BY p.name ASC 
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, 
      paginatedParams
    );

    res.json({ products: rows, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get product by barcode
app.get('/api/products/barcode/:barcode', async (req, res) => {
  const { barcode } = req.params;
  try {
    const { rows } = await db.query(`
      SELECT p.*, p.cost_price as buying_price, b.name as brand, c.name as category 
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.barcode = $1`, [barcode]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unique brands and categories (from tables)
app.get('/api/products/metadata', async (req, res) => {
  try {
    const brands = await db.query('SELECT name FROM brands ORDER BY name ASC');
    const categories = await db.query('SELECT name FROM categories ORDER BY name ASC');
    
    res.json({
      brands: brands.rows.map(r => r.name),
      categories: categories.rows.map(r => r.name)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add new product
// Add new product
app.post('/api/products', async (req, res) => {
  const { name, brand_id, category_id, buying_price, selling_price, stock_quantity, barcode } = req.body;
  try {
    const { rows } = await db.query(
      `INSERT INTO products (name, brand_id, category_id, cost_price, selling_price, stock_quantity, barcode)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *, cost_price as buying_price`,
      [name, brand_id || null, category_id || null, buying_price, selling_price, stock_quantity, barcode]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error adding product' });
  }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { name, brand_id, category_id, buying_price, selling_price, stock_quantity, barcode } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE products 
       SET name=$1, brand_id=$2, category_id=$3, cost_price=$4, selling_price=$5, stock_quantity=$6, barcode=$7
       WHERE id=$8 RETURNING *, cost_price as buying_price`,
      [name, brand_id || null, category_id || null, buying_price, selling_price, stock_quantity, barcode, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating product' });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM products WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error deleting product' });
  }
});

// Process sale
app.post('/api/sales', async (req, res) => {
  const { items, customer_name, customer_mobile, customer_address, notes } = req.body; 
  if (!items || items.length === 0) return res.status(400).json({ error: 'Sale must contain items' });

  try {
    await db.query('BEGIN');
    
    let total_amount = 0;
    let total_cost = 0;
    
    for (const item of items) {
      total_amount += Number(item.selling_price) * item.quantity;
      total_cost += Number(item.cost_price) * item.quantity;
    }
    const profit = total_amount - total_cost;

    // Create sale record with customer info
    const saleResult = await db.query(
      `INSERT INTO sales (total_amount, total_cost, profit, customer_name, customer_mobile, customer_address, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [total_amount, total_cost, profit, customer_name, customer_mobile, customer_address, notes]
    );
    const saleId = saleResult.rows[0].id;

    for (const item of items) {
      await db.query(
        'INSERT INTO sale_items (sale_id, product_id, quantity, selling_price, cost_price) VALUES ($1, $2, $3, $4, $5)',
        [saleId, item.productId, item.quantity, item.selling_price, item.cost_price]
      );
      
      await db.query(
        'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
        [item.quantity, item.productId]
      );
    }

    await db.query('COMMIT');
    res.status(201).json({ saleId });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error processing sale' });
  }
});

// Get daily sales report
app.get('/api/reports/daily', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') as sale_date,
        COUNT(id) as total_transactions,
        SUM(total_amount) as total_revenue,
        SUM(profit) as total_profit
      FROM sales
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY sale_date DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get detailed report for a specific date
app.get('/api/reports/detailed', async (req, res) => {
  const { date } = req.query;
  try {
    let query = `
      SELECT 
        s.id, s.total_amount, s.profit, s.created_at, s.status,
        s.customer_name, s.customer_mobile, s.customer_address, s.notes,
        (SELECT JSON_BUILD_OBJECT(
          'id', ex.id,
          'old_name', po.name, 
          'new_name', pn.name, 
          'diff', ex.price_difference,
          'original_sale_id', ex.original_sale_id,
          'new_sale_id', ex.new_sale_id
         ) 
         FROM product_exchanges ex 
         JOIN products po ON ex.returned_product_id = po.id
         JOIN products pn ON ex.new_product_id = pn.id
         WHERE ex.new_sale_id = s.id OR ex.original_sale_id = s.id
         LIMIT 1
        ) as exchange_info,
        COALESCE(JSON_AGG(JSON_BUILD_OBJECT(
          'id', si.product_id,
          'name', p.name,
          'quantity', si.quantity,
          'selling_price', si.selling_price,
          'is_already_returned', COALESCE(ex_ret.returned_qty, 0) >= si.quantity
        )) FILTER (WHERE p.id IS NOT NULL), '[]') as items
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      LEFT JOIN products p ON si.product_id = p.id
      LEFT JOIN (
        SELECT original_sale_id, returned_product_id, SUM(returned_quantity) as returned_qty
        FROM product_exchanges
        GROUP BY original_sale_id, returned_product_id
      ) ex_ret ON s.id = ex_ret.original_sale_id AND si.product_id = ex_ret.returned_product_id
    `;
    
    let params = [];
    if (date) {
      query += ` WHERE TO_CHAR(s.created_at, 'YYYY-MM-DD') = $1`;
      params.push(date);
    }
    
    query += ` GROUP BY s.id ORDER BY s.created_at DESC`;
    
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST to save PDF base64
app.post('/api/sales/:id/pdf', async (req, res) => {
  const { id } = req.params;
  const { pdfBase64 } = req.body;
  if (!pdfBase64) return res.status(400).json({ error: 'No PDF data provided' });

  const billsDir = path.join(__dirname, 'bills');
  if (!fs.existsSync(billsDir)) fs.mkdirSync(billsDir);

  const filePath = path.join(billsDir, `bill_${id}.pdf`);
  fs.writeFile(filePath, Buffer.from(pdfBase64, 'base64'), (err) => {
    if (err) return res.status(500).json({ error: 'Failed to save PDF' });
    res.status(200).json({ message: 'PDF saved' });
  });
});

// GET to download PDF
app.get('/api/sales/:id/pdf', async (req, res) => {
  const { id } = req.params;
  const filePath = path.join(__dirname, 'bills', `bill_${id}.pdf`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'PDF not found' });
  res.download(filePath);
});

// Get single sale by ID (with exchange details)
app.get('/api/sales/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query(`
      SELECT 
        s.id, s.total_amount, s.profit, s.created_at, s.status,
        s.customer_name, s.customer_mobile, s.customer_address, s.notes,
        (SELECT JSON_BUILD_OBJECT(
          'id', ex.id,
          'old_name', po.name, 
          'new_name', pn.name, 
          'diff', ex.price_difference,
          'original_sale_id', ex.original_sale_id,
          'new_sale_id', ex.new_sale_id
         ) 
         FROM product_exchanges ex 
         JOIN products po ON ex.returned_product_id = po.id
         JOIN products pn ON ex.new_product_id = pn.id
         WHERE ex.new_sale_id = s.id OR ex.original_sale_id = s.id
         LIMIT 1
        ) as exchange_info,
        COALESCE(JSON_AGG(JSON_BUILD_OBJECT(
          'id', si.product_id,
          'name', p.name,
          'quantity', si.quantity,
          'selling_price', si.selling_price
        )) FILTER (WHERE p.id IS NOT NULL), '[]') as items
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      LEFT JOIN products p ON si.product_id = p.id
      WHERE s.id = $1
      GROUP BY s.id
    `, [id]);
    
    if (rows.length === 0) return res.status(404).json({ error: 'Sale not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process product exchange (with audit trail)
app.post('/api/exchanges', async (req, res) => {
  const { original_sale_id, returned_product_id, new_product_id, qty = 1 } = req.body;
  
  try {
    await db.query('BEGIN');

    // 1. Get prices for calculation
    const returnedProd = await db.query('SELECT * FROM products WHERE id = $1', [returned_product_id]);
    const newProd = await db.query('SELECT * FROM products WHERE id = $1', [new_product_id]);
    const originalSale = await db.query('SELECT * FROM sales WHERE id = $1', [original_sale_id]);

    const oldSelling = Number(returnedProd.rows[0].selling_price);
    const newSelling = Number(newProd.rows[0].selling_price);
    const priceDiff = newSelling - oldSelling;
    
    // Calculate profit difference (profit of new item - profit of old item)
    // New Profit = New Selling - New Cost
    // Old Profit = Old Selling - Old Cost (approximate)
    const oldCost = Number(returnedProd.rows[0].cost_price);
    const newCost = Number(newProd.rows[0].cost_price);
    const profitDiff = (newSelling - newCost) - (oldSelling - oldCost);

    // 2. Adjust Stock
    await db.query('UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2', [qty, returned_product_id]);
    await db.query('UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2', [qty, new_product_id]);

    // 3. Mark the original sale as 'Exchanged' but DON'T change its historical totals
    // This maintains revenue integrity: Original (142k) + Correction (43k) = Total (185k)
    await db.query(`UPDATE sales SET status = 'Exchanged' WHERE id = $1`, [original_sale_id]);

    // 5. Create a NEW sale record for the price difference (for the daily ledger!)
    const { rows: saleRows } = await db.query(
      `INSERT INTO sales (total_amount, total_cost, profit, customer_name, customer_mobile, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        priceDiff, 
        (newCost - oldCost), 
        profitDiff, 
        originalSale.rows[0].customer_name, 
        originalSale.rows[0].customer_mobile, 
        `Exchange adjustment from #${original_sale_id}`, 
        'Exchange-Correction'
      ]
    );

    const newSaleId = saleRows[0].id;

    // 5. Log Exchange
    const { rows: exRows } = await db.query(
      `INSERT INTO product_exchanges (original_sale_id, returned_product_id, returned_quantity, new_product_id, new_quantity, price_difference, new_sale_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [original_sale_id, returned_product_id, qty, new_product_id, qty, priceDiff, newSaleId]
    );

    await db.query('COMMIT');
    res.status(201).json({ exchangeId: exRows[0].id, newSaleId, priceDifference: priceDiff });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error processing exchange' });
  }
});

// Get all exchanges (for logs)
app.get('/api/exchanges', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT 
        e.*,
        p_old.name as old_product_name,
        p_new.name as new_product_name,
        s.customer_name
      FROM product_exchanges e
      JOIN products p_old ON e.returned_product_id = p_old.id
      JOIN products p_new ON e.new_product_id = p_new.id
      JOIN sales s ON e.original_sale_id = s.id
      ORDER BY e.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST to save Exchange PDF
app.post('/api/exchanges/:id/pdf', async (req, res) => {
  const { id } = req.params;
  const { pdfBase64 } = req.body;
  if (!pdfBase64) return res.status(400).json({ error: 'No PDF data provided' });

  const exchangeDir = path.join(__dirname, 'bills', 'exchanges');
  if (!fs.existsSync(exchangeDir)) fs.mkdirSync(exchangeDir, { recursive: true });

  const filePath = path.join(exchangeDir, `exchange_${id}.pdf`);
  fs.writeFile(filePath, Buffer.from(pdfBase64, 'base64'), (err) => {
    if (err) return res.status(500).json({ error: 'Failed to save PDF' });
    res.status(200).json({ message: 'Exchange PDF saved' });
  });
});

// GET to download Exchange PDF
app.get('/api/exchanges/:id/pdf', async (req, res) => {
  const { id } = req.params;
  const filePath = path.join(__dirname, 'bills', 'exchanges', `exchange_${id}.pdf`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Exchange PDF not found' });
  res.download(filePath);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
