const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const logger = require('../pkg/logger');
dotenv.config();

const sendMail = async (subject, text, order) => {
  // SMTP settings
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT || 465,
    secure: true,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  // Mail options
  const mailOptions = {
    from: process.env.MAIL_FROM,
    to: process.env.MAIL_TO,
    subject,
    text,
    html: generateOrderHTML(order),
  };

  // Mail send operation
  await transporter.sendMail(mailOptions);
  logger.info('Mail sended: ' + process.env.MAIL_TO);
};

const generateOrderHTML = (order) => {
  const orderDetailsHTML = `
    <h2>Order Details</h2>
    <p><strong>Order Number:</strong> ${order.id}</p>
    <p><strong>Total Amound:</strong> ${order.totalAmount.toFixed(2)} TL</p>
    <p><strong>Shipping Fee:</strong> ${order.shippingFee.toFixed(2)} TL</p>
    <p><strong>Discount Rate:</strong> ${order.discountRate}%</p>
    <p><strong>Discount Amount:</strong> ${order.discountAmount.toFixed(
      2
    )} TL</p>
    <p><strong>Net Amount:</strong> ${order.netAmount.toFixed(2)} TL</p>
  `;

  const cartHTML = `
    <h2>Shopping Cart</h2>
    <ul>
      ${order.cart
        .map((item) => `<li>${item.title} - ${item.quantity} pieces</li>`)
        .join('')}
    </ul>
  `;

  const htmlContent = `
    <html>
      <head></head>
      <body>
        ${orderDetailsHTML}
        ${cartHTML}
      </body>
    </html>
  `;

  return htmlContent;
};

module.exports = sendMail;
