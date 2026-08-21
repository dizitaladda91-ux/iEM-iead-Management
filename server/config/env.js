import dotenv from "dotenv";

dotenv.config();

// Global sanitization for Windows CRLF and whitespace issues
for (const key of Object.keys(process.env)) {
  if (typeof process.env[key] === "string") {
    process.env[key] = process.env[key].replace(/[\r\n]/g, "").trim();
  }
}

/**
 * =====================================================
 * Environment Validation
 * Project : IEM Admissions CRM
 * =====================================================
 */

const validateEnv = () => {
  process.env.PORT ||= "5000";
  process.env.NODE_ENV ||= "development";
  process.env.LOG_LEVEL ||= "info";
  process.env.EMPLOYEE_CODE_PREFIX ||= "EMP";

  if (process.env.NODE_ENV === "test") {
    process.env.JWT_SECRET ||= "test_jwt_secret_key_1234567890";
    process.env.JWT_EXPIRES_IN ||= "1d";
    process.env.JWT_REFRESH_SECRET ||= "test_jwt_refresh_secret_key_1234567890";
    process.env.JWT_REFRESH_EXPIRES_IN ||= "7d";
  }

  const required = [
    "JWT_SECRET",
    "JWT_EXPIRES_IN",
    "JWT_REFRESH_SECRET",
    "JWT_REFRESH_EXPIRES_IN",
  ];

  if (!process.env.DATABASE_URL) {

    required.push(
      "DB_HOST",
      "DB_PORT",
      "DB_USER",
      "DB_PASSWORD",
      "DB_NAME"
    );

  }

  if (process.env.NODE_ENV === "production") {
    required.push("CLIENT_URL");
  }
  /**
   * -------------------------------------
   * Missing Variables
   * -------------------------------------
   */

  const missing = required.filter(
    (key) => !process.env[key]
  );

  if (missing.length > 0) {

    console.error("\n❌ Missing Environment Variables\n");

    missing.forEach((key) => {
      console.error(`• ${key}`);
    });

    console.error("\nPlease update your .env file.\n");

    process.exit(1);

  }

  console.log("✅ Environment Variables Loaded Successfully");

};

/**
 * =====================================================
 * Export Environment
 * =====================================================
 */

export const ENV = Object.freeze({

  PORT: process.env.PORT,

  NODE_ENV: process.env.NODE_ENV,

  LOG_LEVEL: process.env.LOG_LEVEL,

  EMPLOYEE_CODE_PREFIX:
    process.env.EMPLOYEE_CODE_PREFIX,

  JWT_SECRET: process.env.JWT_SECRET,

  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,

  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET,

  JWT_REFRESH_EXPIRES_IN:
    process.env.JWT_REFRESH_EXPIRES_IN,

  DATABASE_URL: process.env.DATABASE_URL,

  DB_SSL: process.env.DB_SSL === "true",

});

export default validateEnv;
