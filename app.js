const express = require('express');
const mysql = require('mysql');
// const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// MySQL connection setup
const db = mysql.createConnection({
  host: 'localhost',
  user: 'mydbuser',           // Replace with your MySQL user
  password: 'mydbuser',   // Replace with your MySQL password
  database: 'myDB',            // Make sure this DB exists
  multipleStatements:true
});

db.connect((err) => {
  if (err) {
    console.error('❌ DB Connection Error:', err);
  } else {
    console.log('✅ Connected to MySQL database!');
  }
});

// Route 1: Create tables when /install is visited
app.get('/install', (req, res) => {
  const createTables = `
    CREATE TABLE IF NOT EXISTS products (
      product_id INT AUTO_INCREMENT PRIMARY KEY,
      product_url VARCHAR(255),
      product_name VARCHAR(100)
    );

    CREATE TABLE IF NOT EXISTS product_descriptions (
      description_id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT,
      product_brief_description VARCHAR(255),
      product_description VARCHAR(255),
      product_img VARCHAR(255),
      FOREIGN KEY (product_id) REFERENCES products(product_id)
    );

    CREATE TABLE IF NOT EXISTS product_prices (
      price_id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT,
      starting_price VARCHAR(50),
      price_range TEXT,
      FOREIGN KEY (product_id) REFERENCES products(product_id)
    );

    CREATE TABLE IF NOT EXISTS users (
      user_id INT AUTO_INCREMENT PRIMARY KEY
    );

    CREATE TABLE IF NOT EXISTS orders (
      order_id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT,
      user_id INT,
      FOREIGN KEY (product_id) REFERENCES products(product_id),
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    );
  `;

  db.query(createTables, (err, result) => {
    if (err) {
      console.error('❌ Failed to create tables:', err.message);
      return res.status(500).send('Failed to create tables');
    }
    console.log('✅ All tables created successfully!');
    res.send('Tables created successfully!');
  });
});

// Route 2: Insert full product details into all related tables
app.post('/add-product-full', (req, res) => {
  const {
    product_url,
    product_name,
    product_brief_description,
    product_description,
    product_img,
    starting_price,
    price_range
  } = req.body;

  const insertProduct = `INSERT INTO products (product_url, product_name) VALUES (?, ?)`;
  db.query(insertProduct, [product_url, product_name], (err, result) => {
    if (err) {
      console.error('❌ Error inserting into products:', err.message);
      return res.status(500).send('Error inserting product');
    }

    const product_id = result.insertId;

    const insertDescription = `
      INSERT INTO product_descriptions (product_id, product_brief_description, product_description, product_img)
      VALUES (?, ?, ?, ?)`;
    db.query(insertDescription, [product_id, product_brief_description, product_description, product_img], (err2) => {
      if (err2) {
        console.error('❌ Error inserting into descriptions:', err2.message);
        return res.status(500).send('Error inserting description');
      }

      const insertPrice = `
        INSERT INTO product_prices (product_id, starting_price, price_range)
        VALUES (?, ?, ?)`;
      db.query(insertPrice, [product_id, starting_price, price_range], (err3) => {
        if (err3) {
          console.error('❌ Error inserting into prices:', err3.message);
          return res.status(500).send('Error inserting price');
        }

        res.send('✅ Product and related data inserted successfully!');
      });
    });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
