const sqlite3 = require('sqlite3').verbose();

// Create database and handle errors
const db = new sqlite3.Database('car_rental.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
    console.log('Database connection established');
});

// Handle database errors
db.on('error', (err) => {
    console.error('Database error:', err);
    process.exit(1);
});

// Clean up database connection on process exit
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        }
        console.log('Database connection closed');
        process.exit(0);
    });
});

// Helper function to create a table
function createTable(sql, tableName) {
    return new Promise((resolve, reject) => {
        db.run(sql, (err) => {
            if (err) {
                console.error(`Error creating ${tableName} table:`, err);
                reject(err);
            } else {
                console.log(`${tableName} table created successfully`);
                resolve();
            }
        });
    });
}

// Helper function to create an index
function createIndex(sql, indexName) {
    return new Promise((resolve, reject) => {
        db.run(sql, (err) => {
            if (err) {
                console.error(`Error creating ${indexName} index:`, err);
                reject(err);
            } else {
                console.log(`${indexName} index created successfully`);
                resolve();
            }
        });
    });
}

// Initialize database tables
async function initializeDatabase() {
    try {
        // Enable foreign keys
        await new Promise((resolve, reject) => {
            db.run('PRAGMA foreign_keys = ON', (err) => {
                if (err) {
                    console.error('Error enabling foreign keys:', err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        // Create tables
        await createTable(
            `CREATE TABLE IF NOT EXISTS USER (
                ID INTEGER PRIMARY KEY AUTOINCREMENT,
                NAME TEXT NOT NULL,
                EMAIL TEXT UNIQUE NOT NULL,
                PASSWORD TEXT NOT NULL
            )`,
            'USER'
        );

        await createTable(
            `CREATE TABLE IF NOT EXISTS CARS (
                ID INTEGER PRIMARY KEY AUTOINCREMENT,
                NAME TEXT NOT NULL,
                PRICE REAL NOT NULL,
                IMAGE TEXT NOT NULL
            )`,
            'CARS'
        );

        await createTable(
            `CREATE TABLE IF NOT EXISTS BOOKINGS (
                ID INTEGER PRIMARY KEY AUTOINCREMENT,
                USER_ID INTEGER,
                CAR_ID INTEGER,
                START_DATE TEXT NOT NULL,
                END_DATE TEXT NOT NULL,
                TOTAL_PRICE REAL NOT NULL,
                STATUS TEXT DEFAULT 'pending'
            )`,
            'BOOKINGS'
        );

        // Create indexes
        await createIndex(
            `CREATE INDEX IF NOT EXISTS idx_user_email ON USER(EMAIL)`,
            'idx_user_email'
        );

        await createIndex(
            `CREATE INDEX IF NOT EXISTS idx_cars_name ON CARS(NAME)`,
            'idx_cars_name'
        );

        await createIndex(
            `CREATE INDEX IF NOT EXISTS idx_bookings_user ON BOOKINGS(USER_ID)`,
            'idx_bookings_user'
        );

        // Add sample cars if none exist
        await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM CARS', [], (err, row) => {
                if (err) {
                    console.error('Error checking cars:', err);
                    reject(err);
                    return;
                }

                if (row.count === 0) {
                    console.log('Adding sample cars...');
                    db.run(`INSERT INTO CARS (NAME, PRICE, IMAGE) VALUES 
                        ('Toyota Camry', 50, 'camry.jpg'),
                        ('Honda Civic', 45, 'civic.jpg'),
                        ('Ford Mustang', 75, 'mustang.jpg')`,
                        (err) => {
                            if (err) {
                                console.error('Error adding sample cars:', err);
                                reject(err);
                            } else {
                                console.log('Sample cars added successfully');
                                resolve();
                            }
                        }
                    );
                } else {
                    console.log('Cars already exist in database');
                    resolve();
                }
            });
        });

        console.log('Database schema initialized successfully');
    } catch (err) {
        console.error('Failed to initialize database:', err);
        throw err;
    }
}

// Initialize database when the module is loaded
initializeDatabase().catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});

// Export the database connection
module.exports = {
    db
};
