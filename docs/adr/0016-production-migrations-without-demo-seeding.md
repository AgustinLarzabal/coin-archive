# Production Migrations Without Demo Seeding

Production releases will apply database migrations but will never run the demo seed command. Production catalogue data is created deliberately through Coin Maintenance, while staging may be reset and seeded with generated demo data for verification.
