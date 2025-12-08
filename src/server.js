const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 Admin routes: http://localhost:${PORT}/admin/*`);
  console.log(`👨‍🎓 Student routes: http://localhost:${PORT}/student/*`);
});
