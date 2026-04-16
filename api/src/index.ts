import mongoose from "mongoose";
import { config } from './config';
import app from './app';

const port = config.port;

if (!config.databaseUrl) {
    console.error("FATAL ERROR: MONGODB_URI is not defined.");
    process.exit(1);
}


mongoose.connect(config.databaseUrl)
    .then(() => {
        console.log('Successfully connected to MongoDB');
        app.listen(port, () => {
            console.log(`Server is listening at http://localhost:${port}`);
        });
    })
    .catch((error) => {
        console.error('Error connecting to database:', error);
        process.exit(1);
    });