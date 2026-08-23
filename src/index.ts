import app from "./server.js";

const PORT = 5163;

app.listen(PORT, () => {
    console.log(`API kör på http://localhost:${PORT}`);
});
