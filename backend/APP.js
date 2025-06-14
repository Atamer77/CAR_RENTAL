const express = require("express");
const app = express();
const cors = require("cors");
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { db } = require('./db.js');
const port = 1911;


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});


app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true
}));

const JWT_SECRET = "your-secret-key";

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const token = req.cookies.authToken;

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: '1h' })
}


app.post('/user/register', (req, res) => {
    console.log('Registration request received:', { 
        hasName: !!req.body.name, 
        hasEmail: !!req.body.email, 
        hasPassword: !!req.body.password 
    });

    try {
        const { name, email, password } = req.body;

        
        if (!name || !email || !password) {
            console.error('Missing required fields:', { name, email, password });
            return res.status(400).json({ error: 'Please provide name, email, and password' });
        }

        if (password.length < 6) {
            console.error('Password too short:', password.length);
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        console.log('Password hashed successfully');

        
        db.get('SELECT email FROM USER WHERE email = ?', [email], (err, row) => {
            if (err) {
                console.error('Database error checking existing user:', {
                    error: err,
                    stack: err.stack,
                    message: err.message
                });
                return res.status(500).json({ 
                    error: 'Database error occurred',
                    details: err.message
                });
            }
            if (row) {
                console.log('Email already registered:', email);
                return res.status(400).json({ error: 'Email is already registered' });
            }

            
            db.run(`INSERT INTO USER (NAME, EMAIL, PASSWORD) VALUES (?, ?, ?)`, 
                [name, email, hashedPassword],
                function(err) {
                    if (err) {
                        console.error('Database error saving user:', {
                            error: err,
                            stack: err.stack,
                            message: err.message,
                            code: err.code,
                            errno: err.errno
                        });
                        return res.status(500).json({ 
                            error: 'Database error occurred',
                            details: err.message
                        });
                    }
                    
                    console.log('User registered successfully:', { userId: this.lastID });
                    return res.status(201).json({ 
                        message: 'Registration successful',
                        userId: this.lastID
                    });
                }
            );
        });
    } catch (error) {
        console.error('Registration error:', {
            error: error,
            stack: error.stack,
            message: error.message
        });
        res.status(400).json({ error: 'Invalid registration data' });
    }
});


app.post('/book', authenticateToken, (req, res) => {
    console.log('Booking request received:', {
        userId: req.user.id,
        hasCarId: !!req.body.carId,
        hasStartDate: !!req.body.startDate,
        hasEndDate: !!req.body.endDate,
        hasTotalPrice: !!req.body.totalPrice,
        hasPaymentDetails: !!req.body.paymentDetails
    });

    try {
        const { carId, startDate, endDate, totalPrice, paymentDetails } = req.body;
        const userId = req.user.id;

        
        if (!carId || !startDate || !endDate || !totalPrice || !paymentDetails) {
            console.error('Missing required booking fields:', {
                carId, startDate, endDate, totalPrice, paymentDetails
            });
            return res.status(400).json({ 
                error: 'Missing required booking details',
                details: 'carId, startDate, endDate, totalPrice, and paymentDetails are required'
            });
        }

        
        db.get('SELECT ID FROM CARS WHERE ID = ?', [carId], (err, row) => {
            if (err) {
                console.error('Error checking car existence:', err);
                return res.status(500).json({ 
                    error: 'Database error occurred',
                    details: err.message
                });
            }
            if (!row) {
                console.error('Car not found:', carId);
                return res.status(404).json({ 
                    error: 'Car not found',
                    details: `Car with ID ${carId} does not exist`
                });
            }

            
            db.run(`INSERT INTO BOOKINGS (USER_ID, CAR_ID, START_DATE, END_DATE, TOTAL_PRICE, STATUS) 
                    VALUES (?, ?, ?, ?, ?, 'pending')`,
                [userId, carId, startDate, endDate, totalPrice],
                function(err) {
                    if (err) {
                        console.error('Error creating booking:', {
                            error: err,
                            stack: err.stack,
                            message: err.message,
                            code: err.code,
                            errno: err.errno
                        });
                        return res.status(500).json({ 
                            error: 'Failed to create booking',
                            details: err.message
                        });
                    }

                    console.log('Booking created successfully:', {
                        bookingId: this.lastID,
                        userId,
                        carId,
                        startDate,
                        endDate,
                        totalPrice
                    });

                    
                    setTimeout(() => {
                        
                        db.run('UPDATE BOOKINGS SET STATUS = ? WHERE ID = ?',
                            ['confirmed', this.lastID],
                            function(err) {
                                if (err) {
                                    console.error('Error updating booking status:', {
                                        error: err,
                                        stack: err.stack,
                                        message: err.message,
                                        code: err.code,
                                        errno: err.errno
                                    });
                                    return res.status(500).json({ 
                                        error: 'Payment processing failed',
                                        details: err.message
                                    });
                                }
                                
                                console.log('Booking confirmed:', {
                                    bookingId: this.lastID,
                                    status: 'confirmed'
                                });
                                
                                res.json({
                                    success: true,
                                    message: 'Payment successful! Booking confirmed',
                                    bookingId: this.lastID
                                });
                            }
                        );
                    }, 1000); 
                }
            );
        });
    } catch (error) {
        console.error('Booking error:', {
            error: error,
            stack: error.stack,
            message: error.message
        });
        res.status(400).json({ 
            error: 'Invalid booking data',
            details: error.message
        });
    }
});


app.post("/user/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    db.get(`SELECT ID FROM USER WHERE EMAIL = ? AND PASSWORD = ?`, 
        [email, hashedPassword],
        (err, row) => {
            if (err) {
                console.error('Database error during login:', err);
                return res.status(500).json({ error: "Database error occurred" });
            }

            if (!row) {
                return res.status(401).json({ error: "Invalid credentials" });
            }

            const token = generateToken(row.ID);
            
            res.cookie('authToken', token, {
                httpOnly: true,
                sameSite: 'lax',
                secure: false,
                maxAge: 3600000 
            });

            return res.status(200).json({ 
                userId: row.ID,
                message: "Login successful"
            });
        }
    );
});


app.get('/cars', (req, res) => {
    console.log('Received request for cars');
    
    try {
        const featuredCars = [
            { 
                id: 1,
                name: 'Mercedes-Benz S-Class', 
                price: 200, 
                image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800'
            },
            { 
                id: 2,
                name: 'BMW X7', 
                price: 180, 
                image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800'
            },
            { 
                id: 3,
                name: 'Porsche 911', 
                price: 250, 
                image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800'
            }
        ];

        console.log('Sending cars data:', featuredCars);
        res.json(featuredCars);
    } catch (error) {
        console.error('Error in cars endpoint:', error);
        res.status(500).json({ error: 'Failed to fetch cars' });
    }
});


app.post('/process-payment', authenticateToken, (req, res) => {
    const { bookingId, paymentDetails } = req.body;
    
    
    db.run('UPDATE BOOKINGS SET STATUS = ? WHERE ID = ?',
        ['paid', bookingId],
        function(err) {
            if (err) {
                console.error('Payment error:', err);
                return res.status(500).json({ error: 'Payment processing failed' });
            }
            res.json({ success: true, message: 'Payment successful!' });
        }
    );
});


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});


app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true
}));


app.listen(port, () => {
    console.log(`App started at port ${port}`);
});


process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        }
        console.log('Database connection closed');
        process.exit(0);
    });
});
