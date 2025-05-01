require("dotenv").config();

const appInsights = require('applicationinsights');
require('@azure/opentelemetry-instrumentation-azure-sdk');

const appInsightsConnectionString = process.env.AZURE_APP_INSIGHTS_CONNECTION_STRING || "";

if (!appInsightsConnectionString) {
    console.error("Azure Application Insights connection string is not set.");
} else {
    appInsights.setup(appInsightsConnectionString)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true, false)
    .setAutoCollectPreAggregatedMetrics(true)
    .setSendLiveMetrics(true)
    .setInternalLogging(false, true)
    .enableWebInstrumentation(false)
    try {
        appInsights.start(); 
    } catch (err) {
        console.error('Failed to start Application Insights:', err);
    }
}


const express = require("express");
const app = express();
const port = process.env.PORT || 3001;
const rateLimitingMiddleware = require("./utils/rateLimitingMiddleware");

app.use(rateLimitingMiddleware());

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const orderRoutes = require("./routes/orderRoutes");


// formatting body requests to json
app.use(express.json());

// to enable CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
})

app.use("/api/auth", authRoutes);
app.use("/api/product", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/order", orderRoutes);


// to handle the thrown errors in my controllers
app.use((error, req, res, next) => {
    const status = error.statusCode || 500;
    const message = error.message;

    res.status(status).json({
        Message: message,
        Success: false
    });
});


app.listen(port, (error) => {
    if (error) {
        console.error('Error starting server:', error);
        return;
    }
    console.log(`Server is running on port ${port}`);
});

/* TO DO
- create github pipelines that deploys the backend to azure app service
- add redis caching to start caching on the server side (redis server to be created on azure)
*/