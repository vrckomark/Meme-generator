// Simple healthcheck script
const response = await fetch("http://localhost:5000/api/health");
if (response.ok) {
  process.exit(0);
} else {
  process.exit(1);
}
