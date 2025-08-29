const express = require('express');
const shareRoutes = require('./routes/share');
const validateShareLink = require('./middleware/validateShareLink');

const app = express();
const port = 3001;

app.use(express.json());

// This is a conceptual example. In a real application, you would
// want to apply the validation middleware to the appropriate routes.
// For example, you might apply it to the main viewer route.
app.use('/viewer/:studyInstanceUID', validateShareLink);

app.use('/api/v1/share', shareRoutes);

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
