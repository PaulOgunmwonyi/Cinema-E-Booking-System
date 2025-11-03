const { body } = require('express-validator');

const ALLOWED_DOMAINS = new Set(['gmail.com', 'yahoo.com', 'outlook.com']);

const COMMON_PASSWORDS = new Set([
  'password','123456','12345678','qwerty','abc123','111111','123456789','12345','1234567'
]);

const normalizedEmail = () =>
  body('email')
    .trim()
    .custom((v) => {
      if (/[A-Z]/.test(v)) {
        throw new Error('Email must be in lowercase');
      }
      return true;
    })
    .toLowerCase()
    .isEmail().withMessage('Valid email required')
    .bail()
    .custom((v) => {
      const domain = v.split('@')[1];
      if (!ALLOWED_DOMAINS.has(domain)) {
        throw new Error('Only gmail.com, yahoo.com, or outlook.com emails are allowed');
      }
      return true;
    });

const nameRule = (field) =>
  body(field)
    .optional({ nullable: true })
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage(`${field} must be 1–50 chars`)
    .matches(/^[\p{L}\p{M}\-'.\s]+$/u).withMessage(`${field} may only contain letters, spaces, - ' .`);

const passwordRule = () =>
  body('password')
    .isString().withMessage('Password required')
    .bail()
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a digit')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain a special character')
    .custom((v) => {
      if (COMMON_PASSWORDS.has(v.toLowerCase())) {
        throw new Error('Password too common');
      }
      return true;
    });

const confirmPasswordRule = () =>
  body('confirmPassword')
    .optional({ nullable: true }) 
    .custom((value, { req }) => {
      if (value != null && value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    });

const phoneRule = () =>
  body('phone')
    .optional({ nullable: true })
    .trim()
    .matches(/^(\+?[1-9]\d{1,14}|(?:\(?\d{3}\)?[.\-\s]?)?\d{3}[.\-\s]?\d{4})$/)
    .withMessage('Phone format is invalid');

const booleanRule = (field) =>
  body(field)
    .optional({ nullable: true })
    .isBoolean().withMessage(`${field} must be boolean`)
    .toBoolean();

const addressRules = () => [
  body('address').optional({ nullable: true }).isObject().withMessage('address must be an object'),
  
  body(['address.street', 'address.line1'])
    .optional({ nullable: true })
    .trim()
    .custom((v) => {
      if (!v) return true;
      const hasLetters = /[A-Za-z]/.test(v);
      const hasNumbers = /\d/.test(v);
      if (!hasLetters || !hasNumbers) {
        throw new Error('Street must contain both letters and numbers (e.g., "123 Main Street")');
      }
      return true;
    }),

  body('address.city')
    .optional({ nullable: true })
    .trim()
    .matches(/^[A-Za-z\s]+$/)
    .withMessage('City must contain only letters'),

  body('address.state')
    .optional({ nullable: true })
    .trim()
    .matches(/^[A-Za-z]{2}$/)
    .withMessage('State must be a 2-letter code'),

  body('address.zip')
    .optional({ nullable: true })
    .trim()
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('ZIP must be 5 digits or ZIP+4'),

  body('address.country')
    .optional({ nullable: true })
    .trim()
    .matches(/^[A-Za-z\s]+$/)
    .withMessage('Country must contain only letters')
];

const cardsRules = () => [
  
  body(['card', 'cards'])
    .optional({ nullable: true })
    .custom((value, { req }) => {
      const arr = Array.isArray(value)
        ? value
        : Array.isArray(req.body.cards)
        ? req.body.cards
        : Array.isArray(req.body.card)
        ? req.body.card
        : [];

      if (arr.length > 3) {
        throw new Error('Maximum of 3 cards allowed');
      }

      const seen = new Set();
      for (const c of arr) {
        const num = c.cardNumber?.replace(/\s/g, '');
        if (num) {
          if (seen.has(num)) {
            throw new Error('Duplicate card numbers are not allowed');
          }
          seen.add(num);
        }
      }
      return true;
    }),

  body(['card.*.cardType', 'cards.*.cardType'])
    .optional({ nullable: true })
    .trim()
    .customSanitizer((v) => v?.toUpperCase())
    .isIn(['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER'])
    .withMessage('cardType must be VISA, MASTERCARD, AMEX, or DISCOVER'),

  body(['card.*.cardNumber', 'cards.*.cardNumber'])
    .optional({ nullable: true })
    .trim()
    .matches(/^\d{16}$/)
    .withMessage('cardNumber must be 16 digits'),

  body(['card.*.expirationDate', 'cards.*.expirationDate'])
    .optional({ nullable: true })
    .trim()
    .matches(/^(0[1-9]|1[0-2])\/\d{2}$/)
    .withMessage('expirationDate must be MM/YY')
];

const rememberMeRule = () =>
  body('rememberMe')
    .optional({ nullable: true })
    .isBoolean().withMessage('rememberMe must be boolean')
    .toBoolean();

const registerValidator = [
  normalizedEmail(),
  nameRule('firstName'),
  nameRule('lastName'),
  passwordRule(),
  confirmPasswordRule(),
  phoneRule(),
  booleanRule('promoOptIn'),
  ...addressRules(),
  ...cardsRules()
];

const loginValidator = [
  normalizedEmail(),
  body('password').isString().withMessage('Password required').notEmpty().withMessage('Password required'),
  rememberMeRule()
];

module.exports = {
  registerValidator,
  loginValidator
};
