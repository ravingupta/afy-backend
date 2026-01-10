import app from './app';

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Agent For You API running on http://localhost:${port}`);
});
