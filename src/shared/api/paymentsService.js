import api from './api';

const paymentsService = {
  // Buy Tokens — /payments/buy-tokens/
  buyTokens: (data) => api.post('/payments/buy-tokens/', data),

  // Create Payment Intent — /payments/create-payment-intent/
  createPaymentIntent: (data) => api.post('/payments/create-payment-intent/', data),

  // Escrow — /payments/escrow/
  fundEscrow: (data) => api.post('/payments/escrow/fund/', data),
  releaseEscrow: (data) => api.post('/payments/escrow/release/', data),
};

export default paymentsService;
