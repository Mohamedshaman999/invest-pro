import { DataTypes } from "sequelize";

export function defineUser(sequelize) {
  return sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      /** National mobile without country code (8 digits, Tunisia). */
      phone: {
        type: DataTypes.STRING(16),
        allowNull: true,
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(8),
        allowNull: false,
        defaultValue: "TND",
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "is_verified",
      },
      verificationCode: {
        type: DataTypes.STRING(32),
        allowNull: true,
        field: "verification_code",
      },
      verificationCodeExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "verification_code_expires_at",
      },
      passwordResetCode: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: "password_reset_code",
      },
      passwordResetExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "password_reset_expires_at",
      },
      /** Incremented on password change / reset to invalidate all JWT access tokens. */
      tokenVersion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: "token_version",
      },
      passwordChangeOtpHash: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: "password_change_otp_hash",
      },
      passwordChangeOtpExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "password_change_otp_expires_at",
      },
      passwordChangeOtpAttempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: "password_change_otp_attempts",
      },
      /** UUID v4 returned to client; must be echoed on confirm (bound to OTP). */
      passwordChangeRequestId: {
        type: DataTypes.STRING(36),
        allowNull: true,
        field: "password_change_request_id",
      },
      /** Lowercase hex fingerprint from IP + User-Agent at request time. */
      passwordChangeContextHash: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: "password_change_context_hash",
      },
      /** Counts failed confirm attempts (wrong OTP, bad context, etc.); drives lockout. */
      passwordChangeConfirmFailures: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: "password_change_confirm_failures",
      },
      passwordChangeLockedUntil: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "password_change_locked_until",
      },
      passwordChangeLastRequestedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "password_change_last_requested_at",
      },
      /** When true, send an email after each BUY/SELL transaction for this user. */
      notifyTransactionEmail: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: "notify_transaction_email",
      },
      /** When true, send email when held assets cross the configured variation threshold. */
      notifyPriceAlertEmail: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: "notify_price_alert_email",
      },
      twoFaEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "two_fa_enabled",
      },
      twoFaMethod: {
        type: DataTypes.STRING(16),
        allowNull: false,
        defaultValue: "email",
        field: "two_fa_method",
      },
      twoFaSecret: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "two_fa_secret",
      },
      /** Failed TOTP checks (setup + login); lockout after threshold. */
      twoFaTotpFailedAttempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: "two_fa_totp_failed_attempts",
      },
      twoFaTotpLockedUntil: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "two_fa_totp_locked_until",
      },
      /** Investisseur standard vs Pro (Trading IA, simulateur avancé). */
      role: {
        type: DataTypes.ENUM("INVESTOR", "PRO_INVESTOR"),
        allowNull: false,
        defaultValue: "INVESTOR",
      },
      /** Abonnement Pro actif (aligné avec dates ; la colonne `role` reste la source API investorRole). */
      isPro: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "is_pro",
      },
      proStartedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "pro_started_at",
      },
      proExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "pro_expires_at",
      },
      proPlanType: {
        type: DataTypes.ENUM("monthly", "yearly"),
        allowNull: true,
        field: "pro_plan_type",
      },
      firstName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: "",
        field: "first_name",
      },
      lastName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: "",
        field: "last_name",
      },
      lastActiveAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "last_active_at",
      },
      failedLoginAttempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: "failed_login_attempts",
      },
      accountLocked: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "account_locked",
      },
      lockReason: {
        type: DataTypes.STRING(512),
        allowNull: true,
        field: "lock_reason",
      },
      lockUntil: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "lock_until",
      },
    },
    {
      tableName: "users",
      paranoid: true,
      indexes: [{ unique: true, fields: ["email"] }],
    }
  );
}
