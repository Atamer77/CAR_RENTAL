import React, { useState } from 'react';
import './Payment.css';

const Payment = ({ userId, carId, carName, pricePerDay, onCancel }) => {
    const initialState = {
        cardNumber: '',
        cardHolder: '',
        expiryDate: '',
        cvv: '',
        startDate: '',
        endDate: '',
    };
    const [paymentDetails, setPaymentDetails] = useState(initialState
    );
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        
        const start = new Date(paymentDetails.startDate);
        const end = new Date(paymentDetails.endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const totalPrice = days * pricePerDay;

        
        fetch('http://localhost:1911/book', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                carId,
                startDate: paymentDetails.startDate,
                endDate: paymentDetails.endDate,
                totalPrice,
                paymentDetails: {
                    cardNumber: paymentDetails.cardNumber,
                    cardHolder: paymentDetails.cardHolder,
                    expiryDate: paymentDetails.expiryDate,
                    cvv: paymentDetails.cvv
                }
            }),
            credentials: 'include'
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    setSuccess(true);
                    setMessage('Payment successful! Your car has been booked.');
                    
                    setPaymentDetails(initialState);
                    
                    setTimeout(() => {
                        onCancel();
                    }, 3000);
                } else {
                    setMessage(data.error || 'Payment failed. Please try again.');
                }
            })
            .catch(error => {
                setMessage('Payment processing failed. Please try again.');
                console.error('Payment error:', error);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <div className="payment-container">
            <h2>Payment Details</h2>
            <div className="payment-summary">
                <h3>Booking Summary</h3>
                <div className="summary-details">
                    <p><strong>Car:</strong> {carName}</p>
                    <p><strong>Price per Day:</strong> ${pricePerDay}</p>
                    <div className="form-group">
                        <label>Start Date</label>
                        <input
                            type="date"
                            value={paymentDetails.startDate}
                            onChange={(e) => setPaymentDetails({
                                ...paymentDetails,
                                startDate: e.target.value
                            })}
                            min={new Date().toISOString().split('T')[0]}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>End Date</label>
                        <input
                            type="date"
                            value={paymentDetails.endDate}
                            onChange={(e) => setPaymentDetails({
                                ...paymentDetails,
                                endDate: e.target.value
                            })}
                            min={paymentDetails.startDate || new Date().toISOString().split('T')[0]}
                            required
                        />
                    </div>
                    {paymentDetails.startDate && paymentDetails.endDate && (
                        <p><strong>Total:</strong> ${Math.ceil((new Date(paymentDetails.endDate) - new Date(paymentDetails.startDate)) / (1000 * 60 * 60 * 24)) * pricePerDay}</p>
                    )}
                </div>
            </div>
            <form className="payment-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Card Number</label>
                    <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={paymentDetails.cardNumber}
                        onChange={(e) => setPaymentDetails({
                            ...paymentDetails,
                            cardNumber: e.target.value.replace(/\D/g, '').slice(0, 16)
                        })}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Card Holder Name</label>
                    <input
                        type="text"
                        placeholder="ahmed tamer"
                        value={paymentDetails.cardHolder}
                        onChange={(e) => setPaymentDetails({
                            ...paymentDetails,
                            cardHolder: e.target.value
                        })}
                        required
                    />
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Expiry Date</label>
                        <input
                            type="text"
                            placeholder="MM/YY"
                            value={paymentDetails.expiryDate}
                            onChange={(e) => setPaymentDetails({
                                ...paymentDetails,
                                expiryDate: e.target.value
                            })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>CVV</label>
                        <input
                            type="text"
                            placeholder="123"
                            value={paymentDetails.cvv}
                            onChange={(e) => setPaymentDetails({
                                ...paymentDetails,
                                cvv: e.target.value.replace(/\D/g, '').slice(0, 3)
                            })}
                            required
                        />
                    </div>
                </div>
                <div className="button-group">
                    <button type="button" onClick={onCancel} className="btn-secondary">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? 'Processing...' : 'Pay Now'}
                    </button>
                </div>
            </form>
            {message && <div className={`message ${success ? 'success' : 'error'}`}>{message}</div>}
        </div>
    );
};

export default Payment;
