// backend/syncDB.js
const db = require('./models'); // models/index.js exports sequelize
db.sequelize.sync({ alter: true }) // alter:true updates tables without dropping data
  .then(() => {
    console.log('Database synced');
    process.exit(0);
  })
  .catch(err => {
    console.error('Sync error:', err);
    process.exit(1);
  });
