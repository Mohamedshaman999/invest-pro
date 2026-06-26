import { createContext, useContext, useEffect, useMemo, useState } from "react";
import frLocale from "../locales/fr.json";
import enLocale from "../locales/en.json";

export type AppLanguage = "fr" | "en" | "es" | "de" | "ar";

type TranslationPack = {
  languageName: string;
  nav: {
    dashboard: string;
    portfolio: string;
    markets: string;
    aiAsset: string;
    aiSimulator: string;
    aiTrading: string;
    aiAssistant: string;
    transactions: string;
    settings: string;
    adminAssets: string;
    adminUsers: string;
    adminMessages: string;
    messages: string;
    withdraw: string;
  };
  header: {
    searchPlaceholder: string;
    searchNoResults: string;
    logout: string;
    admin: string;
    investor: string;
    stndChipLabel: string;
    stndUnit: string;
  };
  sidebar: { proVersion: string; advancedInsights: string; upgrade: string };
  pages: {
    home: {
      brand: string;
      heroTitle: string;
      heroSubtitle: string;
      cta: string;
      previewLabel: string;
      previewTitle: string;
      connected: string;
      balance: string;
      availableFunds: string;
      income: string;
      last30Days: string;
      signal: string;
      portfolioMomentum: string;
      insights: string;
      healthForecast: string;
      premium: string;
      spendRate: string;
      riskLevel: string;
      low: string;
      aiInsights: string;
      automatedGuidance: string;
      automatedGuidanceDesc: string;
      secure: string;
      enterpriseProtection: string;
      enterpriseProtectionDesc: string;
      design: string;
      immersiveUi: string;
      immersiveUiDesc: string;
      deepInsights: string;
      precisionHeadline: string;
      precisionSubheadline: string;
      precisionTracking: string;
      precisionTrackingDesc: string;
      adaptiveAlerts: string;
      adaptiveAlertsDesc: string;
      glowingPerformance: string;
      glowingPerformanceDesc: string;
      nextLevelControl: string;
      longerPageTitle: string;
      longerPageDesc: string;
      monthlyVolume: string;
      conversion: string;
      retention: string;
    };
    dashboard: {
      title: string;
      subtitle: string;
      statLabels: {
        totalValue: string;
        profitLoss: string;
        assetsCount: string;
        performance: string;
      };
      statChanges: {
        thisMonth: string;
        assetsDifferent: string;
        over7Months: string;
      };
      /** Labels for net-worth card info breakdown: "Label: X TND | Label: Y TND" */
      totalValueBreakdownAssets: string;
      totalValueBreakdownCash: string;
      totalValueInfoAria: string;
      chart: {
        portfolioTitle: string;
        portfolioSubtitle: string;
        distributionTitle: string;
        distributionSubtitle: string;
        tooltipValueLabel: string;
        donutTotalLabel: string;
        /** Shown after percentage in donut tooltip, e.g. "12% of invested portfolio" */
        distributionTooltipInvestedShare: string;
      };
      performanceMonths: string[];
      assetTypes: {
        stock: string;
        crypto: string;
        etf: string;
      };
      table: {
        topPerformances: string;
        asset: string;
        quantity: string;
        purchasePrice: string;
        currentPrice: string;
        gainLoss: string;
      };
    };
    portfolio: {
      title: string;
      subtitle: string;
      buyAsset: string;
      loadAccount: string;
      sell: string;
      noTransactions: string;
      insufficientStnd: string;
      withdraw: string;
    };
    loadAccount: {
      title: string;
      subtitle: string;
      amountLabel: string;
      quickSelect: string;
      paymentMethod: string;
      enterAmount: string;
      confirmPayment: string;
      successMessage: string;
      trial: string;
      creditedStndDetail: string;
      stepOf: string;
      summaryTitle: string;
      summaryCharge: string;
      securePaymentTitle: string;
      securePaymentCopy: string;
      fastFundingTitle: string;
      fastFundingPoints: string[];
      reviewChargeNote: string;
      back: string;
      continue: string;
      cardEnding: string;
      d17Via: string;
      summaryMethodCard: string;
      summaryMethodD17: string;
    };
    withdraw: {
      title: string;
      subtitle: string;
      amountLabel: string;
      methodTitle: string;
      methodBankTitle: string;
      methodBankDesc: string;
      beneficiaryTitle: string;
      fullNameLabel: string;
      fullNamePlaceholder: string;
      ribLabel: string;
      ribPlaceholder: string;
      ribHint: string;
      bankLabel: string;
      bankPlaceholder: string;
      confirmWithdrawal: string;
      reviewNote: string;
      successPending: string;
      successDetail: string;
      ribInvalid: string;
      amountExceedsBalance: string;
      summaryTitle: string;
      summaryAmount: string;
      summaryBank: string;
      summaryHolder: string;
      summaryRib: string;
      availableBalance: string;
    };
    wallet: { stndExplainer: string };
    markets: {
      title: string;
      subtitle: string;
      searchPlaceholder: string;
      all: string;
      stocks: string;
      crypto: string;
      favorites: string;
      clearFilters: string;
      noMatchFilters: string;
    };
    aiAsset: {
      title: string;
      subtitle: string;
      searchPlaceholder: string;
      explain: string;
      cardWhat: string;
      cardRisk: string;
      cardWhy: string;
      disclaimer: string;
      loading: string;
      loadingAssets: string;
      pickAsset: string;
      error: string;
    };
    aiTradingPage: {
      moduleLabel: string;
      title: string;
      subtitle: string;
      newBot: string;
      verificationRequired: string;
      activeBotsHeading: string;
      loading: string;
      emptyBots: string;
      pnlTitle: string;
      pnlSubtitle: string;
      socketStream: string;
      controlPanelTitle: string;
      selectedBot: string;
      modeManual: string;
      modeAiStrategy: string;
      transactionsPerDay: string;
      start: string;
      pause: string;
      stopHard: string;
      realizedLossToday: string;
      operationsFeedTitle: string;
      marketBannerUnavailable: string;
      feedLoading: string;
      feedEmpty: string;
      tableHeaderAsset: string;
      tableHeaderAction: string;
      tableHeaderAmount: string;
      tableHeaderResult: string;
      tableHeaderTime: string;
      actionBuy: string;
      actionSell: string;
      statusSuccess: string;
      statusPending: string;
      statusFailed: string;
      loadBotsError: string;
      loadFeedError: string;
      dailyLossLimitReached: string;
      botStartedToast: string;
      botPausedToast: string;
      botStoppedToast: string;
      actionFailed: string;
    };
    aiTradingWizard: {
      title: string;
      description: string;
      botNameLabel: string;
      botNamePlaceholder: string;
      modeLabel: string;
      manualStrategy: string;
      manualStrategyHint: string;
      aiStrategy: string;
      aiStrategyHint: string;
      maxAllocationLabel: string;
      maxTransactionsLabel: string;
      riskLevelLabel: string;
      riskLow: string;
      riskMedium: string;
      riskHigh: string;
      assetSymbolLabel: string;
      assetPlaceholder: string;
      assetEmptyLabel: string;
      assetRequiredHint: string;
      buyConditionLabel: string;
      buyConditionPercentage: string;
      buyConditionPrice: string;
      buyConditionAiSignal: string;
      buyThresholdLabel: string;
      reinforceWithAiSignal: string;
      takeProfitLabel: string;
      stopLossLabel: string;
      useAiExitLabel: string;
      riskWarningTitle: string;
      riskWarningBody: string;
      riskScoreTitle: string;
      riskScoreSubtitle: string;
      summaryNameLabel: string;
      summaryModeLabel: string;
      summaryMaxTradeLabel: string;
      summaryAssetLabel: string;
      confirmRiskLabel: string;
      back: string;
      next: string;
      createBot: string;
      creating: string;
      errorChooseAsset: string;
      errorChooseAssetSymbol: string;
      errorConfirmRisk: string;
      successCreated: string;
      errorCreationFailed: string;
    };
    simulator: {
      title: string;
      subtitle: string;
      monthlyLabel: string;
      yearsLabel: string;
      portfolioBasisLabel: string;
      disclaimerPastPerformance: string;
      loadingExpectedReturn: string;
      portfolioUnavailable: string;
      breakdownHeading: string;
      breakdownWeight: string;
      breakdownReturn: string;
      estimatedAnnualReturn: string;
      customReturnToggle: string;
      customReturnLabel: string;
      run: string;
      loading: string;
      emptyHint: string;
      invalidNumbers: string;
      finalValue: string;
      contributed: string;
      gain: string;
      chartTitle: string;
      chartProjected: string;
      chartContributed: string;
      year0: string;
      yearPrefix: string;
      aiTitle: string;
      error: string;
      footerNote: string;
    };
    transactions: { title: string; subtitle: string; totalBuy: string; totalSell: string; totalTransactions: string; fromStart: string };
    settings: { title: string; subtitle: string; preferences: string; language: string; currency: string; timezone: string };
    admin: { title: string; subtitle: string };
    adminDashboard: { subtitle: string };
    adminUsersPage: {
      title: string;
      subtitle: string;
      loadError: string;
      empty: string;
      colName: string;
      colEmail: string;
      colLastActive: string;
      colStatus: string;
      colRisk: string;
      colActions: string;
      statusActive: string;
      statusLocked: string;
      riskBadgeLow: string;
      riskBadgeMid: string;
      riskBadgeHigh: string;
      view: string;
      delete: string;
      unlock: string;
      prev: string;
      next: string;
      pageLabel: string;
      detailTitle: string;
      roleInvestor: string;
      rolePro: string;
      failedAttempts: string;
      lockReason: string;
      confirmDeleteTitle: string;
      confirmDeleteBody: string;
      cancel: string;
      confirm: string;
      deletedToast: string;
      unlockedToast: string;
      neverActive: string;
      close: string;
    };
    login: {
      title: string;
      subtitle: string;
      createAccount: string;
      emailOrPasswordInvalid: string;
      emailLabel: string;
      passwordLabel: string;
      showPasswordAria: string;
      hidePasswordAria: string;
      rememberMe: string;
      forgotPassword: string;
      signIn: string;
      noAccount: string;
      demoPrefix: string;
      demoBody: string;
      realtimeTitle: string;
      realtimeDesc: string;
      securityTitle: string;
      securityDesc: string;
    };
    register: {
      title: string;
      subtitle: string;
      success: string;
      passwordInvalid: string;
      under18: string;
      familyName: string;
      name: string;
      dateOfBirth: string;
      email: string;
      password: string;
      createMyAccount: string;
      alreadyHaveAccount: string;
      performanceTitle: string;
      performanceDesc: string;
      protectionTitle: string;
      protectionDesc: string;
      passwordRuleLetter: string;
      passwordRuleNumber: string;
      passwordRuleSymbol: string;
      passwordRuleLength: string;
      showPasswordCheckboxLabel: string;
    };
    forgotPassword: {
      title: string;
      subtitle: string;
      emailLabel: string;
      sendCode: string;
      successHint: string;
      backToLogin: string;
      continueToReset: string;
    };
    resetPassword: {
      title: string;
      subtitle: string;
      codeLabel: string;
      newPasswordLabel: string;
      resetButton: string;
      successToast: string;
      backToLogin: string;
      invalidCode: string;
      missingEmail: string;
    };
    upgrade: {
      heroBadge: string;
      heroTitle: string;
      heroSubtitle: string;
      whatYouGet: string;
      whatYouGetPoints: string[];
      stepLabels: {
        step: string;
        planSelection: string;
        paymentMethod: string;
        details: string;
        review: string;
      };
      planNames: { monthly: string; yearly: string };
      planPrices: { monthly: string; yearly: string };
      planHighlights: { yearly: string };
      planDetails: {
        flexibleMonthlyBilling: string;
        cancelAnytime: string;
        bestValue: string;
        twoMonthsFree: string;
      };
      trialLabel: string;
      selectedLabel: string;
      paymentMethods: { card: string; d17: string };
      paymentMethodDescriptions: { card: string; d17: string };
      cardNumber: string;
      expiryDate: string;
      cvv: string;
      nameOnCard: string;
      cardNumberPlaceholder: string;
      expiryPlaceholder: string;
      cvvPlaceholder: string;
      cardholderNamePlaceholder: string;
      phoneNumber: string;
      phonePlaceholder: string;
      phoneHelp: string;
      selectedPlanLabel: string;
      billedMonthly: string;
      billedYearly: string;
      summaryTitle: string;
      summaryPaymentMethod: string;
      summaryTrial: string;
      securePaymentTitle: string;
      securePaymentCopy: string;
      premiumBenefitsTitle: string;
      premiumBenefitsPoints: string[];
      cardTypes: { visa: string; mastercard: string; amex: string; discover: string; unknown: string };
      validation: {
        requiredField: string;
        invalidCardNumber: string;
        invalidCardNumberLength: string;
        invalidExpiryFormat: string;
        cardExpired: string;
        invalidCvv: string;
        invalidCardholderName: string;
      };
      back: string;
      continue: string;
      startFreeTrial: string;
      payViaD17: string;
      confirmPayment: string;
      d17Checkout: {
        title: string;
        subtitle: string;
        stepsTitle: string;
        step1: string;
        step2: string;
        step3: string;
        amountLabel: string;
        planLabel: string;
        phoneLabel: string;
        footerNote: string;
        backToUpgrade: string;
        goDashboard: string;
        confirmPaidActivate: string;
        invalidSession: string;
        retryUpgrade: string;
      };
    };
    messages: {
      title: string;
      subtitle: string;
      contactAdmin: string;
      modalTitle: string;
      subjectOptional: string;
      subjectPlaceholder: string;
      messageLabel: string;
      messagePlaceholder: string;
      send: string;
      cancel: string;
      noConversations: string;
      selectConversation: string;
      closedHint: string;
      placeholderReply: string;
      loadingList: string;
      loadingThread: string;
      unread: string;
      adminLabel: string;
      youLabel: string;
      verifyRequired: string;
      adminTitle: string;
      adminSubtitle: string;
      colUser: string;
      colRole: string;
      colLastMessage: string;
      colStatus: string;
      colUnread: string;
      filterStatus: string;
      filterRole: string;
      filterAll: string;
      closeConversation: string;
      reopenConversation: string;
      statusOpen: string;
      statusClosed: string;
      roleInvestor: string;
      rolePro: string;
      backToList: string;
      sentToast: string;
      sendError: string;
      createdToast: string;
    };
    aiAssistant: {
      title: string;
      subtitle: string;
      placeholder: string;
      attachStock: string;
      send: string;
      newChat: string;
      historyTitle: string;
      noConversations: string;
      emptyThreadHint: string;
      lockedTitle: string;
      lockedSubtitle: string;
      upgradeCta: string;
      retry: string;
      sendError: string;
      stockPickerTitle: string;
      stockSearch: string;
      pick: string;
      attachedPrefix: string;
      clearStock: string;
      typing: string;
      deleteConversation: string;
      deleteConversationAria: string;
      deleteConversationConfirm: string;
      deleteConversationError: string;
    };
    proFeature: {
      modalTitle: string;
      modalSubtitle: string;
      upgradeCta: string;
      badgePro: string;
      previewFeatures: string[];
      lockHint: string;
    };
  };
};

const translations: Record<AppLanguage, TranslationPack> = {
  fr: {
    languageName: "Francais",
    nav: {
      dashboard: "Tableau de bord",
      portfolio: "Portefeuille",
      markets: "Marches",
      aiAsset: "IA actifs",
      aiSimulator: "Simulateur",
      aiTrading: "Trading IA",
      aiAssistant: "Assistant IA",
      transactions: "Transactions",
      settings: "Parametres",
      adminAssets: "Admin - Actifs",
      adminUsers: "Gestion des utilisateurs",
      adminMessages: "Messages utilisateurs",
      messages: "Messages",
      withdraw: frLocale.nav.withdraw,
    },
    header: {
      searchPlaceholder: "Rechercher un actif... (⌘K)",
      searchNoResults: "Aucun titre trouve",
      logout: "Se deconnecter",
      admin: "Admin",
      investor: "Investisseur",
      stndChipLabel: frLocale.header.stndChipLabel,
      stndUnit: frLocale.header.stndUnit,
    },
    sidebar: { proVersion: "Version Pro", advancedInsights: "Accedez a des analyses avancees", upgrade: "Passer Pro" },
    pages: {
      dashboard: {
        title: "Tableau de bord",
        subtitle: "Apercu de votre portefeuille d'investissement",
        statLabels: {
          totalValue: "Valeur totale",
          profitLoss: "Profit/Perte",
          assetsCount: "Nombre d'actifs",
          performance: "Performance",
        },
        statChanges: {
          thisMonth: "Ce mois",
          assetsDifferent: "Actifs différents",
          over7Months: "Sur 7 mois",
        },
        totalValueBreakdownAssets: "Actifs",
        totalValueBreakdownCash: "Espèces",
        totalValueInfoAria: "Détail : actifs cotés et solde en espèces",
        chart: {
          portfolioTitle: "Performance du portefeuille",
          portfolioSubtitle: "Évolution sur les 7 derniers mois",
          distributionTitle: "Répartition",
          distributionSubtitle: "Par type d'actif",
          tooltipValueLabel: "Valeur",
          donutTotalLabel: "Valeur des actifs",
          distributionTooltipInvestedShare: "du portefeuille investi",
        },
        performanceMonths: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil"],
        assetTypes: {
          stock: "Actions",
          crypto: "Crypto-monnaies",
          etf: "ETF",
        },
        table: {
          topPerformances: "Meilleures performances",
          asset: "Actif",
          quantity: "Quantité",
          purchasePrice: "Prix d'achat",
          currentPrice: "Prix actuel",
          gainLoss: "Gain/Perte",
        },
      },
      portfolio: {
        title: "Mon Portefeuille",
        subtitle: "Gerez vos actifs et suivez leurs performances",
        buyAsset: "Acheter un actif",
        loadAccount: "Charger le compte",
        sell: "Vendre",
        noTransactions: "Aucune transaction trouvee",
        insufficientStnd: frLocale.pages.portfolio.insufficientStnd,
        withdraw: frLocale.pages.portfolio.withdraw,
      },
      loadAccount: {
        title: "Charger le compte",
        subtitle: "Ajoutez des fonds a votre solde",
        amountLabel: "Montant (TND)",
        quickSelect: "Selection rapide",
        paymentMethod: "Mode de paiement",
        enterAmount: "Entrez un montant positif",
        confirmPayment: "Confirmer le paiement",
        successMessage: "Fonds ajoutes avec succes",
        trial: "Essai gratuit de 7 jours",
        ...frLocale.pages.loadAccount,
      },
      withdraw: frLocale.pages.withdraw,
      wallet: frLocale.pages.wallet,
      markets: {
        title: "Marches",
        subtitle: "Suivez les performances du marche en temps reel",
        searchPlaceholder: "Rechercher un actif...",
        all: "Tous",
        stocks: "Actions",
        crypto: "Crypto",
        favorites: "Favoris",
        clearFilters: "Reinitialiser les filtres",
        noMatchFilters: "Aucun titre ne correspond a vos filtres",
      },
      aiAsset: {
        title: "Explicateur d'actifs IA",
        subtitle: "Textes simples pour comprendre un titre avant d'aller plus loin",
        searchPlaceholder: "Nom ou code (ex. BIAT, BTC)...",
        explain: "Voir l'explication",
        cardWhat: "En bref",
        cardRisk: "Risque (lecture simple)",
        cardWhy: "Pourquoi quelqu'un investirait",
        disclaimer: "Rappel : ce contenu est educatif, pas un conseil personnalise.",
        loading: "Generation de l'explication...",
        loadingAssets: "Chargement des actifs...",
        pickAsset: "Choisissez un actif dans la liste ou cherchez par code.",
        error: "Impossible de charger l'explication. Verifiez le backend ou reessayez.",
      },
      aiTradingPage: {
        moduleLabel: "Trading IA",
        title: "Trading IA",
        subtitle: "Gérez vos bots de trading automatisé et suivez les opérations en temps réel.",
        newBot: "Nouveau bot",
        verificationRequired: "Veuillez vérifier votre e-mail pour accéder au trading.",
        activeBotsHeading: "Bots actifs",
        loading: "Chargement...",
        emptyBots: "Aucun bot disponible.",
        pnlTitle: "Profit net",
        pnlSubtitle: "P&L total de vos bots",
        socketStream: "Flux en direct des opérations",
        controlPanelTitle: "Panneau de contrôle",
        selectedBot: "Bot sélectionné :",
        modeManual: "Manuel",
        modeAiStrategy: "Stratégie IA",
        transactionsPerDay: "tx/j",
        start: "Démarrer",
        pause: "Pause",
        stopHard: "Arrêt dur",
        realizedLossToday: "Perte réalisée aujourd'hui :",
        operationsFeedTitle: "Flux d'opérations",
        marketBannerUnavailable: "Historique indisponible pour ce bot.",
        feedLoading: "Chargement du flux...",
        feedEmpty: "Aucune opération enregistrée.",
        tableHeaderAsset: "Actif",
        tableHeaderAction: "Action",
        tableHeaderAmount: "Montant",
        tableHeaderResult: "Résultat",
        tableHeaderTime: "Heure",
        actionBuy: "Achat",
        actionSell: "Vente",
        statusSuccess: "Succès",
        statusPending: "En attente",
        statusFailed: "Échec",
        loadBotsError: "Impossible de charger les bots.",
        loadFeedError: "Impossible de charger l'historique du bot.",
        dailyLossLimitReached: "Limite de perte journalière atteinte : le bot a été arrêté.",
        botStartedToast: "Bot démarré.",
        botPausedToast: "Bot en pause.",
        botStoppedToast: "Bot arrêté.",
        actionFailed: "Action impossible.",
      },
      aiTradingWizard: {
        title: "Assistant de création — bot de trading IA",
        description: "Création guidée d’un bot avec contrôle des risques et conditions d’achat ou de vente.",
        botNameLabel: "Nom du bot",
        botNamePlaceholder: "ex. Stratégie BVMT prudente",
        modeLabel: "Mode",
        manualStrategy: "Stratégie manuelle",
        manualStrategyHint: "Règles explicites (% seuil, prix...)",
        aiStrategy: "Stratégie IA",
        aiStrategyHint: "Score pondéré (tendance, volatilité...)",
        maxAllocationLabel: "Budget max par opération (TND)",
        maxTransactionsLabel: "Transactions max / jour",
        riskLevelLabel: "Niveau de risque",
        riskLow: "Faible",
        riskMedium: "Moyen",
        riskHigh: "Élevé",
        assetSymbolLabel: "Actif (symbole)",
        assetPlaceholder: "— Choisir une action —",
        assetEmptyLabel: "Aucun actif pour le filtre Marchés actuel. Ajustez les filtres sur la page Marchés.",
        assetRequiredHint: "Veuillez choisir un actif pour continuer.",
        buyConditionLabel: "Condition d’achat",
        buyConditionPercentage: "% baisse",
        buyConditionPrice: "Prix max",
        buyConditionAiSignal: "Signal IA",
        buyThresholdLabel: "Seuil d’achat (%, ou prix TND selon le mode)",
        reinforceWithAiSignal: "Renforcer avec signal IA (mode manuel)",
        takeProfitLabel: "Take profit (%)",
        stopLossLabel: "Stop loss (%)",
        useAiExitLabel: "Sortie assistée par IA",
        riskWarningTitle: "Avertissement risque",
        riskWarningBody:
          "Le trading automatisé comporte un risque de perte en capital. Les performances passées ne préjugent pas des résultats futurs. Le moteur s’appuie sur des données de marché qui peuvent être indisponibles ou retardées.",
        riskScoreTitle: "Score de risque estimé (indicatif)",
        riskScoreSubtitle: "Basé sur le plafond par trade, le niveau de risque et la fréquence max.",
        summaryNameLabel: "Nom :",
        summaryModeLabel: "Mode :",
        summaryMaxTradeLabel: "Max / trade :",
        summaryAssetLabel: "Actif :",
        confirmRiskLabel:
          "Je confirme avoir lu l’avertissement et accepter le lancement ultérieur du bot sous ma responsabilité.",
        back: "Retour",
        next: "Suivant",
        createBot: "Créer le bot",
        creating: "Création...",
        errorChooseAsset: "Choisissez un actif avant de continuer.",
        errorChooseAssetSymbol: "Choisissez un symbole d’actif.",
        errorConfirmRisk: "Vous devez confirmer avoir pris connaissance des risques.",
        successCreated: "Bot créé. Vous pouvez le démarrer depuis le panneau de contrôle.",
        errorCreationFailed: "Création impossible",
      },
      simulator: {
        title: "Simulateur d'investissement",
        subtitle: "Projection sur versements mensuels : le rendement annuel est estime a partir de votre portefeuille et de donnees de marche (Yahoo Finance).",
        monthlyLabel: "Versement mensuel (TND)",
        yearsLabel: "Duree de la simulation (annees)",
        portfolioBasisLabel: "Estimation fondee sur votre portefeuille actuel et l'historique de marche",
        disclaimerPastPerformance: "Les performances passes ne predisent pas les resultats futurs.",
        loadingExpectedReturn: "Calcul du rendement attendu a partir de votre portefeuille...",
        portfolioUnavailable:
          "Impossible d'estimer le rendement (portefeuille vide ou donnees indisponibles). Ajoutez des positions ou activez le mode personnalise.",
        breakdownHeading: "Detail par ligne",
        breakdownWeight: "Poids",
        breakdownReturn: "Rendement annualise estime",
        estimatedAnnualReturn: "Rendement annuel estime du portefeuille",
        customReturnToggle: "Utiliser un rendement personnalise (saisie manuelle)",
        customReturnLabel: "Rendement annuel personnalise (%)",
        run: "Calculer et expliquer",
        loading: "Calcul et generation du texte...",
        emptyHint: "Remplissez les champs puis lancez la simulation.",
        invalidNumbers: "Valeurs numeriques invalides.",
        finalValue: "Valeur finale projetee",
        contributed: "Total verse",
        gain: "Effet des interets composes",
        chartTitle: "Courbe projetee",
        chartProjected: "Solde projete",
        chartContributed: "Cumul des versements",
        year0: "Depart",
        yearPrefix: "An",
        aiTitle: "Explication",
        error: "Impossible d'appeler l'API. Verifiez que le backend tourne (npm run dev:all).",
        footerNote:
          "Hypothese : meme montant chaque fin de mois, taux nominal annuel, capitalisation mensuelle. Les projections ne garantissent pas les performances futures.",
      },
      transactions: { title: "Transactions", subtitle: "Historique complet de vos transactions", totalBuy: "Total des achats", totalSell: "Total des ventes", totalTransactions: "Total transactions", fromStart: "Depuis le debut" },
      settings: { title: "Parametres", subtitle: "Gerez vos preferences et votre securite", preferences: "Preferences", language: "Langue", currency: "Devise", timezone: "Fuseau horaire" },
      admin: { title: "Administration des actifs", subtitle: "Ajoutez des actifs (avec une API de prix) et supprimez ceux qui ne doivent plus etre disponibles." },
      adminDashboard: {
        subtitle: "Outils d’administration : utilisateurs, actifs cotés et messagerie support.",
      },
      adminUsersPage: {
        title: "Gestion des utilisateurs",
        subtitle: "Liste des comptes, risque connexion et verrouillage automatique.",
        loadError: "Impossible de charger les utilisateurs.",
        empty: "Aucun utilisateur.",
        colName: "Nom",
        colEmail: "E-mail",
        colLastActive: "Derniere activite",
        colStatus: "Statut",
        colRisk: "Risque",
        colActions: "Actions",
        statusActive: "Actif",
        statusLocked: "Verrouille",
        riskBadgeLow: "Faible",
        riskBadgeMid: "Attention",
        riskBadgeHigh: "Critique",
        view: "Voir",
        delete: "Supprimer",
        unlock: "Deverrouiller",
        prev: "Precedent",
        next: "Suivant",
        pageLabel: "Page",
        detailTitle: "Profil utilisateur",
        roleInvestor: "Investisseur",
        rolePro: "Pro",
        failedAttempts: "Echecs mot de passe",
        lockReason: "Motif du verrouillage",
        confirmDeleteTitle: "Confirmer la suppression",
        confirmDeleteBody: "Archiver cet utilisateur ? Le compte sera desactive (suppression logique).",
        cancel: "Annuler",
        confirm: "Confirmer",
        deletedToast: "Utilisateur archive.",
        unlockedToast: "Compte deverrouille.",
        neverActive: "Jamais",
        close: "Fermer",
      },
      home: {
        brand: "INVESTPRO",
        heroTitle: "Prenez le controle total de votre argent",
        heroSubtitle: "Suivez vos depenses, comparez vos performances et obtenez des insights premium.",
        cta: "Commencer gratuitement",
        previewLabel: "Apercu du dashboard",
        previewTitle: "Controle financier immersif",
        connected: "Connecte",
        balance: "Solde",
        availableFunds: "Fonds disponibles",
        income: "Revenus",
        last30Days: "30 derniers jours",
        signal: "Signal",
        portfolioMomentum: "Momentum du portefeuille",
        insights: "Insights",
        healthForecast: "Sante du portefeuille & previsions",
        premium: "Premium",
        spendRate: "Taux de depense",
        riskLevel: "Niveau de risque",
        low: "Faible",
        aiInsights: "Insights IA",
        automatedGuidance: "Guidage automatise du portefeuille",
        automatedGuidanceDesc: "Des recommandations intelligentes pour agir plus vite.",
        secure: "Securise",
        enterpriseProtection: "Protection niveau entreprise",
        enterpriseProtectionDesc: "Chiffrement multi-couches et controles d'acces avances.",
        design: "Design",
        immersiveUi: "Interface minimaliste et immersive",
        immersiveUiDesc: "Une experience premium avec un design moderne et fluide.",
        deepInsights: "Insights approfondis",
        precisionHeadline: "Construit pour les investisseurs de precision",
        precisionSubheadline: "Analyses puissantes et controles elegants pour agir avec confiance.",
        precisionTracking: "Suivi de precision",
        precisionTrackingDesc: "Surveillez chaque position avec des metriques claires.",
        adaptiveAlerts: "Alertes adaptatives",
        adaptiveAlertsDesc: "Recevez des signaux en temps reel sur les mouvements essentiels.",
        glowingPerformance: "Performance lumineuse",
        glowingPerformanceDesc: "Visualisez la croissance avec des graphes propres et modernes.",
        nextLevelControl: "Controle nouvelle generation",
        longerPageTitle: "Explorez des capacites premium avancees",
        longerPageDesc: "Decouvrez des outils fintech evolues et une interface raffinee.",
        monthlyVolume: "Volume mensuel",
        conversion: "Conversion",
        retention: "Retention",
      },
      login: {
        title: "Connexion",
        subtitle: "Accedez a votre portefeuille d'investissement",
        createAccount: "Creer un compte",
        emailOrPasswordInvalid: "Email ou mot de passe incorrect",
        emailLabel: "Email",
        passwordLabel: "Mot de passe",
        showPasswordAria: "Afficher le mot de passe",
        hidePasswordAria: "Masquer le mot de passe",
        rememberMe: "Se souvenir de moi",
        forgotPassword: "Mot de passe oublie ?",
        signIn: "Se connecter",
        noAccount: "Pas encore de compte ?",
        demoPrefix: "Compte serveur :",
        demoBody:
          "Connectez-vous uniquement avec un compte inscrit sur cette API (inscription + code e-mail). En developpement, le backend cree automatiquement : investor.demo@example.com / Invest#demo1, admin@example.com / Admin#demo1 et pro.demo@example.com / Pro#demo1 (Pro Investisseur).",
        realtimeTitle: "Donnees en temps reel",
        realtimeDesc: "Suivez les cours en direct et restez informe des mouvements du marche.",
        securityTitle: "Securite maximale",
        securityDesc: "Vos donnees sont protegees avec les dernieres technologies de chiffrement.",
      },
      register: {
        title: "Creer un compte",
        subtitle: "Renseignez vos informations pour continuer",
        success: "Compte cree avec succes. Vous pouvez maintenant vous connecter.",
        passwordInvalid: "Le mot de passe ne respecte pas tous les criteres.",
        under18: "Inscription refusee: vous devez avoir au moins 18 ans.",
        familyName: "Nom",
        name: "Prenom",
        dateOfBirth: "Date de naissance",
        email: "Email",
        password: "Mot de passe",
        createMyAccount: "Creer mon compte",
        alreadyHaveAccount: "Vous avez deja un compte ?",
        performanceTitle: "Suivi de performance",
        performanceDesc: "Analysez l evolution de vos investissements avec des indicateurs clairs.",
        protectionTitle: "Protection du compte",
        protectionDesc: "Utilisez un mot de passe solide pour securiser vos informations.",
        passwordRuleLetter: "Au moins une lettre",
        passwordRuleNumber: "Au moins un chiffre",
        passwordRuleSymbol: "Au moins un symbole",
        passwordRuleLength: "Minimum 8 caracteres",
        showPasswordCheckboxLabel: "Afficher le mot de passe",
      },
      forgotPassword: {
        title: "Mot de passe oublie",
        subtitle: "Nous enverrons un code a 6 chiffres a votre adresse e-mail.",
        emailLabel: "Email",
        sendCode: "Envoyer le code",
        successHint: "Si un compte existe, consultez votre boite mail pour le code de reinitialisation.",
        backToLogin: "Retour a la connexion",
        continueToReset: "Definir un nouveau mot de passe",
      },
      resetPassword: {
        title: "Nouveau mot de passe",
        subtitle: "Saisissez le code recu par e-mail et choisissez un nouveau mot de passe.",
        codeLabel: "Code a 6 chiffres",
        newPasswordLabel: "Nouveau mot de passe",
        resetButton: "Reinitialiser le mot de passe",
        successToast: "Mot de passe mis a jour. Vous pouvez vous connecter.",
        backToLogin: "Retour a la connexion",
        invalidCode: "Code invalide ou expire. Demandez un nouveau code.",
        missingEmail: "Commencez par la page mot de passe oublie pour indiquer votre e-mail.",
      },
      upgrade: {
        heroBadge: "Mise a niveau Premium",
        heroTitle: "Boostez votre portefeuille avec Pro",
        heroSubtitle: "Accedez a des analyses avancees et une experience de trading amelioree.",
        whatYouGet: "Ce que vous obtenez",
        whatYouGetPoints: ["Analyses de performance avancees", "Support prioritaire", "Traitement de paiement securise"],
        stepLabels: {
          step: "Etape {step} sur 4",
          planSelection: "Selection du plan",
          paymentMethod: "Methode de paiement",
          details: "Details",
          review: "Revision",
        },
        planNames: { monthly: "Plan mensuel", yearly: "Plan annuel" },
        planPrices: { monthly: "20 TND / mois", yearly: "200 TND / an" },
        planHighlights: { yearly: "Economisez 40 TND" },
        planDetails: {
          flexibleMonthlyBilling: "Facturation mensuelle flexible",
          cancelAnytime: "Annuler a tout moment",
          bestValue: "Meilleur rapport qualite-prix",
          twoMonthsFree: "2 mois gratuits",
        },
        trialLabel: "Essai gratuit de 7 jours",
        selectedLabel: "Selectionne",
        paymentMethods: { card: "Paiement par carte", d17: "Paiement mobile D17" },
        paymentMethodDescriptions: { card: "Visa, Mastercard ou carte locale", d17: "Paiement mobile tunisien via D17" },
        cardNumber: "Numero de carte",
        expiryDate: "Date d'expiration",
        cvv: "CVV",
        nameOnCard: "Nom sur la carte",
        phoneNumber: "Numero de telephone",
        phonePlaceholder: "+216 9xx xxx xxx",
        phoneHelp: "Un lien de paiement securise sera envoye a votre telephone.",
        selectedPlanLabel: "Plan selectionne",
        billedMonthly: "Facture mensuelle de 20 TND",
        billedYearly: "Facture annuelle de 200 TND",
        summaryTitle: "Resume",
        summaryPaymentMethod: "Methode de paiement",
        summaryTrial: "Essai gratuit de 7 jours inclus",
        securePaymentTitle: "Paiement securise",
        securePaymentCopy: "Vos informations sont protegees avec un chiffrement standard de l'industrie.",
        premiumBenefitsTitle: "Avantages Premium",
        premiumBenefitsPoints: ["Analyses avancees", "Support prioritaire", "Onboarding securise"],
        back: "Retour",
        continue: "Continuer",
        startFreeTrial: "Commencer l'essai gratuit",
        payViaD17: "Payer via D17",
        confirmPayment: "Confirmer le paiement",
        d17Checkout: {
          title: "Paiement D17",
          subtitle: "Terminez le reglement dans l'application D17 sur votre telephone.",
          stepsTitle: "Etapes",
          step1: "Ouvrez l'application D17 et identifiez-vous.",
          step2: "Effectuez un transfert du montant indique vers le compte marchand InvestPro (RIB ou numero communiques par notre equipe / e-mail de confirmation).",
          step3: "Utilisez comme libelle ou reference votre adresse e-mail ou le numero ci-dessous pour lier le paiement a votre compte.",
          amountLabel: "Montant a payer",
          planLabel: "Plan",
          phoneLabel: "Telephone saisi",
          footerNote:
            "La validation peut prendre jusqu'a 24 h. En cas de doute, contactez le support depuis la messagerie.",
          backToUpgrade: "Modifier le plan",
          goDashboard: "Retour au tableau de bord",
          confirmPaidActivate: "J’ai payé — activer Pro",
          invalidSession: "Informations de paiement manquantes. Recommencez depuis la page d'upgrade.",
          retryUpgrade: "Retour a l'upgrade",
        },
        cardNumberPlaceholder: "1234 5678 9012 3456",
        expiryPlaceholder: "MM/AA",
        cvvPlaceholder: "123",
        cardholderNamePlaceholder: "Nom du titulaire",
        cardTypes: { visa: "Visa", mastercard: "MasterCard", amex: "American Express", discover: "Discover", unknown: "Carte" },
        validation: {
          requiredField: "Champ obligatoire",
          invalidCardNumber: "Numero de carte invalide",
          invalidCardNumberLength: "Le numero de carte doit comporter entre 13 et 19 chiffres",
          invalidExpiryFormat: "Date d'expiration invalide",
          cardExpired: "Carte expirée",
          invalidCvv: "CVV invalide",
          invalidCardholderName: "Nom invalide",
        },
      },
      messages: {
        title: "Messages",
        subtitle: "Echangez avec l'equipe InvestPro",
        contactAdmin: "Contacter l'admin",
        modalTitle: "Nouvelle conversation",
        subjectOptional: "Sujet (optionnel)",
        subjectPlaceholder: "Objet de votre demande",
        messageLabel: "Message",
        messagePlaceholder: "Decrivez votre demande…",
        send: "Envoyer",
        cancel: "Annuler",
        noConversations: "Aucune conversation pour le moment.",
        selectConversation: "Choisissez une conversation dans la liste.",
        closedHint: "Cette conversation est fermee.",
        placeholderReply: "Ecrivez votre message…",
        loadingList: "Chargement…",
        loadingThread: "Chargement des messages…",
        unread: "Non lu",
        adminLabel: "Support InvestPro",
        youLabel: "Vous",
        verifyRequired: "Verifiez votre adresse e-mail pour acceder a la messagerie.",
        adminTitle: "Messages utilisateurs",
        adminSubtitle: "Conversations investisseurs et reponses admin",
        colUser: "Utilisateur",
        colRole: "Role",
        colLastMessage: "Dernier message",
        colStatus: "Statut",
        colUnread: "Non lus",
        filterStatus: "Statut",
        filterRole: "Role",
        filterAll: "Tous",
        closeConversation: "Fermer",
        reopenConversation: "Rouvrir",
        statusOpen: "Ouverte",
        statusClosed: "Fermee",
        roleInvestor: "Investisseur",
        rolePro: "Pro",
        backToList: "Retour a la liste",
        sentToast: "Message envoye",
        sendError: "Envoi impossible",
        createdToast: "Conversation creee",
      },
      aiAssistant: {
        title: "Assistant IA",
        subtitle: "Questions actions et marche avec donnees plateforme et contexte marché.",
        placeholder: "Posez une question sur une action (ex. « L’UBCI est-elle haussiere aujourd’hui ? »)",
        attachStock: "Joindre un titre",
        send: "Envoyer",
        newChat: "Nouvelle conversation",
        historyTitle: "Historique",
        noConversations: "Aucune conversation enregistree.",
        emptyThreadHint: "Posez une question ou joignez un symbole pour enrichir le contexte.",
        lockedTitle: "Assistant IA reserve aux Investisseurs Pro",
        lockedSubtitle: "Passez Pro pour poser des questions sur les actions avec donnees temps reel et historique.",
        upgradeCta: "Passer Pro",
        retry: "Reessayer",
        sendError: "Impossible d’obtenir une reponse.",
        stockPickerTitle: "Choisir un titre",
        stockSearch: "Rechercher un symbole ou un nom…",
        pick: "Selectionner",
        attachedPrefix: "Contexte",
        clearStock: "Retirer",
        typing: "L’IA reflechit",
        deleteConversation: "Supprimer",
        deleteConversationAria: "Supprimer cette conversation",
        deleteConversationConfirm: "Supprimer cette conversation ? Cette action est definitive.",
        deleteConversationError: "Impossible de supprimer la conversation.",
      },
      proFeature: {
        modalTitle: "Fonction Pro",
        modalSubtitle: "Passez Pro pour debloquer le Trading IA et le Simulateur avance.",
        upgradeCta: "Passer Pro",
        badgePro: "Pro",
        previewFeatures: [
          "Bots de trading IA avec regles et plafonds",
          "Simulateur de projection et rendement attendu du portefeuille",
          "Flux temps reel securise (Socket.io)",
        ],
        lockHint: "Reserve aux comptes Pro Investisseur.",
      },
    },
  },
  en: {
    languageName: "English",
    nav: {
      dashboard: "Dashboard",
      portfolio: "Portfolio",
      markets: "Markets",
      aiAsset: "AI assets",
      aiSimulator: "Simulator",
      aiTrading: "AI trading",
      aiAssistant: "AI Assistant",
      transactions: "Transactions",
      settings: "Settings",
      adminAssets: "Admin - Assets",
      adminUsers: "User management",
      adminMessages: "User messages",
      messages: "Messages",
      withdraw: enLocale.nav.withdraw,
    },
    header: {
      searchPlaceholder: "Search an asset... (⌘K)",
      searchNoResults: "No stocks found",
      logout: "Log out",
      admin: "Admin",
      investor: "Investor",
      stndChipLabel: enLocale.header.stndChipLabel,
      stndUnit: enLocale.header.stndUnit,
    },
    sidebar: { proVersion: "Pro Version", advancedInsights: "Access advanced analytics", upgrade: "Upgrade to Pro" },
    pages: {
      dashboard: {
        title: "Dashboard",
        subtitle: "Overview of your investment portfolio",
        statLabels: {
          totalValue: "Total Value",
          profitLoss: "Profit/Loss",
          assetsCount: "Assets Count",
          performance: "Performance",
        },
        statChanges: {
          thisMonth: "This month",
          assetsDifferent: "Different assets",
          over7Months: "Over 7 months",
        },
        totalValueBreakdownAssets: "Assets",
        totalValueBreakdownCash: "Cash",
        totalValueInfoAria: "Breakdown: market assets and cash balance",
        chart: {
          portfolioTitle: "Portfolio performance",
          portfolioSubtitle: "Evolution over the last 7 months",
          distributionTitle: "Distribution",
          distributionSubtitle: "By asset type",
          tooltipValueLabel: "Value",
          donutTotalLabel: "Asset value",
          distributionTooltipInvestedShare: "of invested portfolio",
        },
        performanceMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
        assetTypes: {
          stock: "Stocks",
          crypto: "Cryptocurrencies",
          etf: "ETF",
        },
        table: {
          topPerformances: "Top performances",
          asset: "Asset",
          quantity: "Quantity",
          purchasePrice: "Purchase price",
          currentPrice: "Current price",
          gainLoss: "Profit/Loss",
        },
      },
      portfolio: {
        title: "My Portfolio",
        subtitle: "Manage your assets and track performance",
        buyAsset: "Buy an asset",
        loadAccount: "Load account",
        sell: "Sell",
        noTransactions: "No transactions found",
        insufficientStnd: enLocale.pages.portfolio.insufficientStnd,
        withdraw: enLocale.pages.portfolio.withdraw,
      },
      loadAccount: {
        title: "Load account",
        subtitle: "Add funds to your balance",
        amountLabel: "Amount (TND)",
        quickSelect: "Quick select",
        paymentMethod: "Payment method",
        enterAmount: "Enter a positive amount",
        confirmPayment: "Confirm payment",
        successMessage: "Funds added successfully",
        trial: "7-day free trial included",
        ...enLocale.pages.loadAccount,
      },
      withdraw: enLocale.pages.withdraw,
      wallet: enLocale.pages.wallet,
      markets: {
        title: "Markets",
        subtitle: "Track market performance in real time",
        searchPlaceholder: "Search an asset...",
        all: "All",
        stocks: "Stocks",
        crypto: "Crypto",
        favorites: "Favorites",
        clearFilters: "Clear filters",
        noMatchFilters: "No stocks match your filters",
      },
      aiAsset: {
        title: "AI asset explainer",
        subtitle: "Plain-language context before you dig deeper",
        searchPlaceholder: "Name or ticker (e.g. BIAT, BTC)...",
        explain: "Get explanation",
        cardWhat: "In plain words",
        cardRisk: "Risk (simple read)",
        cardWhy: "Why people invest",
        disclaimer: "Reminder: educational only — not personal advice.",
        loading: "Generating explanation...",
        loadingAssets: "Loading assets...",
        pickAsset: "Pick an asset from the list or search by ticker.",
        error: "Could not load the explanation. Check the API or try again.",
      },
      aiTradingPage: {
        moduleLabel: "AI trading",
        title: "AI trading",
        subtitle: "Manage your automated trading bots and watch activity in real time.",
        newBot: "New bot",
        verificationRequired: "Verify your email to access trading.",
        activeBotsHeading: "Active bots",
        loading: "Loading...",
        emptyBots: "No bots found.",
        pnlTitle: "Net P&L",
        pnlSubtitle: "Cumulative profit and loss from your bots",
        socketStream: "Live operation stream",
        controlPanelTitle: "Control panel",
        selectedBot: "Selected bot:",
        modeManual: "Manual",
        modeAiStrategy: "AI strategy",
        transactionsPerDay: "tx/day",
        start: "Start",
        pause: "Pause",
        stopHard: "Hard stop",
        realizedLossToday: "Realized loss today:",
        operationsFeedTitle: "Operations feed",
        marketBannerUnavailable: "History unavailable for this bot.",
        feedLoading: "Loading feed...",
        feedEmpty: "No operations recorded.",
        tableHeaderAsset: "Asset",
        tableHeaderAction: "Action",
        tableHeaderAmount: "Amount",
        tableHeaderResult: "Result",
        tableHeaderTime: "Time",
        actionBuy: "Buy",
        actionSell: "Sell",
        statusSuccess: "Success",
        statusPending: "Pending",
        statusFailed: "Failed",
        loadBotsError: "Unable to load bots.",
        loadFeedError: "Unable to load bot history.",
        dailyLossLimitReached: "Daily loss limit reached: the bot has been stopped.",
        botStartedToast: "Bot started.",
        botPausedToast: "Bot paused.",
        botStoppedToast: "Bot stopped.",
        actionFailed: "Action failed.",
      },
      aiTradingWizard: {
        title: "Creation wizard — AI trading bot",
        description: "Guided bot creation with risk controls and buy/sell conditions.",
        botNameLabel: "Bot name",
        botNamePlaceholder: "e.g. Conservative BVMT strategy",
        modeLabel: "Mode",
        manualStrategy: "Manual strategy",
        manualStrategyHint: "Explicit rules (% threshold, price...)",
        aiStrategy: "AI strategy",
        aiStrategyHint: "Weighted score (trend, volatility...)",
        maxAllocationLabel: "Max allocation per trade (TND)",
        maxTransactionsLabel: "Max transactions per day",
        riskLevelLabel: "Risk level",
        riskLow: "Low",
        riskMedium: "Medium",
        riskHigh: "High",
        assetSymbolLabel: "Asset (symbol)",
        assetPlaceholder: "— Pick an asset —",
        assetEmptyLabel: "No assets match the current Markets filter. Adjust filters on the Markets page.",
        assetRequiredHint: "Please choose an asset to continue.",
        buyConditionLabel: "Buy condition",
        buyConditionPercentage: "% drop",
        buyConditionPrice: "Max price",
        buyConditionAiSignal: "AI signal",
        buyThresholdLabel: "Buy threshold (% or TND price depending on mode)",
        reinforceWithAiSignal: "Reinforce with AI signal (manual mode)",
        takeProfitLabel: "Take profit (%)",
        stopLossLabel: "Stop loss (%)",
        useAiExitLabel: "AI-assisted exit",
        riskWarningTitle: "Risk warning",
        riskWarningBody:
          "Automated trading carries a risk of capital loss. Past performance does not guarantee future results. The engine relies on market data that may be unavailable or delayed.",
        riskScoreTitle: "Estimated risk score (indicative)",
        riskScoreSubtitle: "Based on max allocation per trade, risk level, and the frequency cap.",
        summaryNameLabel: "Name:",
        summaryModeLabel: "Mode:",
        summaryMaxTradeLabel: "Max / trade:",
        summaryAssetLabel: "Asset:",
        confirmRiskLabel:
          "I confirm I have read the warning and accept that starting the bot is my responsibility.",
        back: "Back",
        next: "Next",
        createBot: "Create bot",
        creating: "Creating...",
        errorChooseAsset: "Choose an asset before continuing.",
        errorChooseAssetSymbol: "Choose an asset symbol.",
        errorConfirmRisk: "You must confirm that you understand the risks.",
        successCreated: "Bot created. You can start it from the control panel.",
        errorCreationFailed: "Creation failed",
      },
      simulator: {
        title: "Investment simulator",
        subtitle: "Monthly savings projection: the annual return is estimated from your portfolio and market history (Yahoo Finance).",
        monthlyLabel: "Monthly investment (TND)",
        yearsLabel: "Simulation horizon (years)",
        portfolioBasisLabel: "Based on your current portfolio and historical market data",
        disclaimerPastPerformance: "Past performance does not guarantee future results.",
        loadingExpectedReturn: "Computing expected return from your portfolio…",
        portfolioUnavailable:
          "Could not estimate return (empty portfolio or unavailable data). Add holdings or enable custom return.",
        breakdownHeading: "Line-by-line breakdown",
        breakdownWeight: "Weight",
        breakdownReturn: "Estimated annualized return",
        estimatedAnnualReturn: "Estimated portfolio annual return",
        customReturnToggle: "Use a custom return (manual override)",
        customReturnLabel: "Custom annual return (%)",
        run: "Run simulation",
        loading: "Computing…",
        emptyHint: "Fill the fields and run the simulation.",
        invalidNumbers: "Invalid numeric values.",
        finalValue: "Projected ending balance",
        contributed: "Total contributed",
        gain: "Growth above contributions",
        chartTitle: "Projected path",
        chartProjected: "Projected balance",
        chartContributed: "Cumulative contributions",
        year0: "Start",
        yearPrefix: "Year",
        aiTitle: "Explanation",
        error: "Could not reach the API. Ensure the backend is running (npm run dev:all).",
        footerNote:
          "Assumption: same amount at each month-end, nominal annual rate, monthly compounding. Projections are not guarantees of future performance.",
      },
      transactions: { title: "Transactions", subtitle: "Complete history of your transactions", totalBuy: "Total buys", totalSell: "Total sells", totalTransactions: "Total transactions", fromStart: "From the beginning" },
      settings: { title: "Settings", subtitle: "Manage your preferences and security", preferences: "Preferences", language: "Language", currency: "Currency", timezone: "Time zone" },
      admin: { title: "Asset Administration", subtitle: "Add assets (with a pricing API) and remove those that should no longer be available." },
      adminDashboard: {
        subtitle: "Admin tools: user accounts, listed assets, and support messaging.",
      },
      adminUsersPage: {
        title: "User management",
        subtitle: "Accounts, login risk and automatic lockouts.",
        loadError: "Could not load users.",
        empty: "No users.",
        colName: "Name",
        colEmail: "Email",
        colLastActive: "Last active",
        colStatus: "Status",
        colRisk: "Risk",
        colActions: "Actions",
        statusActive: "Active",
        statusLocked: "Locked",
        riskBadgeLow: "Low",
        riskBadgeMid: "Watch",
        riskBadgeHigh: "Critical",
        view: "View",
        delete: "Delete",
        unlock: "Unlock",
        prev: "Previous",
        next: "Next",
        pageLabel: "Page",
        detailTitle: "User profile",
        roleInvestor: "Investor",
        rolePro: "Pro",
        failedAttempts: "Failed password attempts",
        lockReason: "Lock reason",
        confirmDeleteTitle: "Confirm deletion",
        confirmDeleteBody: "Archive this user? The account will be soft-deleted.",
        cancel: "Cancel",
        confirm: "Confirm",
        deletedToast: "User archived.",
        unlockedToast: "Account unlocked.",
        neverActive: "Never",
        close: "Close",
      },
      home: {
        brand: "INVESTPRO",
        heroTitle: "Take full control of your money with ease",
        heroSubtitle: "Track spending, compare performance, and unlock premium insights.",
        cta: "Get Started For Free",
        previewLabel: "Dashboard preview",
        previewTitle: "Immersive finance control",
        connected: "Connected",
        balance: "Balance",
        availableFunds: "Available funds",
        income: "Income",
        last30Days: "Last 30 days",
        signal: "Signal",
        portfolioMomentum: "Portfolio momentum",
        insights: "Insights",
        healthForecast: "Portfolio health & forecast",
        premium: "Premium",
        spendRate: "Spend rate",
        riskLevel: "Risk level",
        low: "Low",
        aiInsights: "AI insights",
        automatedGuidance: "Automated portfolio guidance",
        automatedGuidanceDesc: "Intelligent recommendations help you move faster.",
        secure: "Secure",
        enterpriseProtection: "Enterprise-grade protection",
        enterpriseProtectionDesc: "Multi-layer encryption and access controls.",
        design: "Design",
        immersiveUi: "Minimal, immersive UI",
        immersiveUiDesc: "Clean layouts and subtle motion for premium experiences.",
        deepInsights: "Deep insights",
        precisionHeadline: "Built for investors who want precision",
        precisionSubheadline: "Powerful analytics and elegant controls to act with confidence.",
        precisionTracking: "Precision tracking",
        precisionTrackingDesc: "Monitor every position with crisp metrics.",
        adaptiveAlerts: "Adaptive alerts",
        adaptiveAlertsDesc: "Stay ahead with real-time signals.",
        glowingPerformance: "Glowing performance",
        glowingPerformanceDesc: "Visualize growth with clean charts and soft glow accents.",
        nextLevelControl: "Next-level control",
        longerPageTitle: "A longer page to explore premium capabilities",
        longerPageDesc: "Discover advanced fintech tools and a polished interface.",
        monthlyVolume: "Monthly volume",
        conversion: "Conversion",
        retention: "Retention",
      },
      login: {
        title: "Login",
        subtitle: "Access your investment portfolio",
        createAccount: "Create an account",
        emailOrPasswordInvalid: "Incorrect email or password",
        emailLabel: "Email",
        passwordLabel: "Password",
        showPasswordAria: "Show password",
        hidePasswordAria: "Hide password",
        rememberMe: "Remember me",
        forgotPassword: "Forgot password?",
        signIn: "Sign in",
        noAccount: "No account yet?",
        demoPrefix: "Server account:",
        demoBody:
          "Sign in only with a user registered on this API (register, then enter the email code). In development the backend auto-seeds: investor.demo@example.com / Invest#demo1, admin@example.com / Admin#demo1, and pro.demo@example.com / Pro#demo1 (Pro Investor).",
        realtimeTitle: "Real-time data",
        realtimeDesc: "Track live prices and stay informed on market moves.",
        securityTitle: "Maximum security",
        securityDesc: "Your data is protected with modern encryption technology.",
      },
      register: {
        title: "Create an account",
        subtitle: "Fill in your information to continue",
        success: "Account created successfully. You can now log in.",
        passwordInvalid: "The password does not meet all requirements.",
        under18: "Registration denied: you must be at least 18 years old.",
        familyName: "Family name",
        name: "Name",
        dateOfBirth: "Date of birth",
        email: "Email",
        password: "Password",
        createMyAccount: "Create my account",
        alreadyHaveAccount: "Already have an account?",
        performanceTitle: "Performance tracking",
        performanceDesc: "Analyze your investments with clear indicators.",
        protectionTitle: "Account protection",
        protectionDesc: "Use a strong password to secure your data.",
        passwordRuleLetter: "At least one letter",
        passwordRuleNumber: "At least one number",
        passwordRuleSymbol: "At least one symbol",
        passwordRuleLength: "Minimum 8 characters",
        showPasswordCheckboxLabel: "Show password",
      },
      forgotPassword: {
        title: "Forgot password",
        subtitle: "We will email you a 6-digit code to reset your password.",
        emailLabel: "Email",
        sendCode: "Send code",
        successHint: "If the email exists, check your inbox for the reset code.",
        backToLogin: "Back to login",
        continueToReset: "Set new password",
      },
      resetPassword: {
        title: "Set new password",
        subtitle: "Enter the code from your email and choose a new password.",
        codeLabel: "6-digit code",
        newPasswordLabel: "New password",
        resetButton: "Reset password",
        successToast: "Password updated. You can sign in now.",
        backToLogin: "Back to login",
        invalidCode: "Invalid or expired code. Request a new one from forgot password.",
        missingEmail: "Start from forgot password and enter your email first.",
      },
      upgrade: {
        heroBadge: "Premium upgrade",
        heroTitle: "Power up your portfolio with Pro",
        heroSubtitle: "Unlock advanced analytics and an elevated trading experience.",
        whatYouGet: "What you get",
        whatYouGetPoints: ["Advanced performance analytics", "Priority support", "Secure payment flow"],
        stepLabels: {
          step: "Step {step} of 4",
          planSelection: "Plan selection",
          paymentMethod: "Payment method",
          details: "Details",
          review: "Review",
        },
        planNames: { monthly: "Monthly Plan", yearly: "Yearly Plan" },
        planPrices: { monthly: "20 TND / month", yearly: "200 TND / year" },
        planHighlights: { yearly: "Save 40 TND" },
        planDetails: {
          flexibleMonthlyBilling: "Flexible monthly billing",
          cancelAnytime: "Cancel anytime",
          bestValue: "Best value for annual membership",
          twoMonthsFree: "2 months free",
        },
        trialLabel: "7-day free trial",
        selectedLabel: "Selected",
        paymentMethods: { card: "Card payment", d17: "D17 (Mobile payment)" },
        paymentMethodDescriptions: { card: "Visa, Mastercard or local card", d17: "Tunisia mobile payment via D17" },
        cardNumber: "Card number",
        expiryDate: "Expiry date",
        cvv: "CVV",
        nameOnCard: "Name on card",
        phoneNumber: "Phone number",
        phonePlaceholder: "+216 9xx xxx xxx",
        phoneHelp: "A secure payment link will be sent to your phone.",
        selectedPlanLabel: "Selected plan",
        billedMonthly: "Billed monthly at 20 TND",
        billedYearly: "Billed yearly at 200 TND",
        summaryTitle: "Summary",
        summaryPaymentMethod: "Payment method",
        summaryTrial: "7-day free trial included",
        securePaymentTitle: "Secure payment",
        securePaymentCopy: "Your information is protected using industry standard encryption.",
        premiumBenefitsTitle: "Premium benefits",
        premiumBenefitsPoints: ["Advanced analytics", "Priority support", "Secure onboarding"],
        back: "Back",
        continue: "Continue",
        startFreeTrial: "Start free trial",
        payViaD17: "Pay via D17",
        confirmPayment: "Confirm payment",
        d17Checkout: {
          title: "D17 payment",
          subtitle: "Complete payment in the D17 app on your phone.",
          stepsTitle: "Steps",
          step1: "Open the D17 app and sign in.",
          step2: "Send the amount shown to the InvestPro merchant account (details sent by email or support).",
          step3: "Use your email or the phone below as the payment reference so we can match your account.",
          amountLabel: "Amount due",
          planLabel: "Plan",
          phoneLabel: "Phone entered",
          footerNote: "Activation may take up to 24 hours. Contact support via Messages if you need help.",
          backToUpgrade: "Change plan",
          goDashboard: "Back to dashboard",
          confirmPaidActivate: "I've paid — activate Pro",
          invalidSession: "Missing payment session. Start again from the upgrade page.",
          retryUpgrade: "Back to upgrade",
        },
        cardNumberPlaceholder: "1234 5678 9012 3456",
        expiryPlaceholder: "MM/YY",
        cvvPlaceholder: "123",
        cardholderNamePlaceholder: "Cardholder name",
        cardTypes: { visa: "Visa", mastercard: "Mastercard", amex: "American Express", discover: "Discover", unknown: "Card" },
        validation: {
          requiredField: "This field is required",
          invalidCardNumber: "Invalid card number",
          invalidCardNumberLength: "Card number must be 13 to 19 digits",
          invalidExpiryFormat: "Invalid expiry date",
          cardExpired: "Card expired",
          invalidCvv: "Invalid CVV",
          invalidCardholderName: "Invalid cardholder name",
        },
      },
      messages: {
        title: "Messages",
        subtitle: "Chat with the InvestPro team",
        contactAdmin: "Contact admin",
        modalTitle: "New conversation",
        subjectOptional: "Subject (optional)",
        subjectPlaceholder: "What is this about?",
        messageLabel: "Message",
        messagePlaceholder: "Describe your request…",
        send: "Send",
        cancel: "Cancel",
        noConversations: "No conversations yet.",
        selectConversation: "Pick a conversation from the list.",
        closedHint: "This conversation is closed.",
        placeholderReply: "Write your message…",
        loadingList: "Loading…",
        loadingThread: "Loading messages…",
        unread: "Unread",
        adminLabel: "InvestPro support",
        youLabel: "You",
        verifyRequired: "Verify your email to use messaging.",
        adminTitle: "User messages",
        adminSubtitle: "Investor conversations and admin replies",
        colUser: "User",
        colRole: "Role",
        colLastMessage: "Last message",
        colStatus: "Status",
        colUnread: "Unread",
        filterStatus: "Status",
        filterRole: "Role",
        filterAll: "All",
        closeConversation: "Close",
        reopenConversation: "Reopen",
        statusOpen: "Open",
        statusClosed: "Closed",
        roleInvestor: "Investor",
        rolePro: "Pro",
        backToList: "Back to list",
        sentToast: "Message sent",
        sendError: "Could not send",
        createdToast: "Conversation created",
      },
      aiAssistant: {
        title: "AI Assistant",
        subtitle: "Ask stock questions grounded in platform data and market context.",
        placeholder: "Ask about any stock (e.g. “Is Tesla bullish today?”)",
        attachStock: "Attach stock",
        send: "Send",
        newChat: "New conversation",
        historyTitle: "History",
        noConversations: "No saved conversations yet.",
        emptyThreadHint: "Ask a question or attach a symbol for richer context.",
        lockedTitle: "AI Assistant is for Pro Investors",
        lockedSubtitle: "Upgrade to Pro to ask stock questions with live and historical data.",
        upgradeCta: "Upgrade to Pro",
        retry: "Retry",
        sendError: "Could not get a response.",
        stockPickerTitle: "Pick a stock",
        stockSearch: "Search symbol or name…",
        pick: "Select",
        attachedPrefix: "Context",
        clearStock: "Remove",
        typing: "Assistant is thinking",
        deleteConversation: "Delete",
        deleteConversationAria: "Delete this conversation",
        deleteConversationConfirm: "Delete this conversation? This cannot be undone.",
        deleteConversationError: "Could not delete the conversation.",
      },
      proFeature: {
        modalTitle: "Pro feature",
        modalSubtitle: "Upgrade to unlock AI Trading & the advanced Simulator.",
        upgradeCta: "Upgrade to Pro",
        badgePro: "Pro",
        previewFeatures: [
          "AI trading bots with rules and daily caps",
          "Portfolio projection simulator with expected return",
          "Secure real-time Socket.io feed",
        ],
        lockHint: "Included with Pro Investor accounts.",
      },
    },
  },
  es: {
    languageName: "Espanol",
    nav: {
      dashboard: "Panel",
      portfolio: "Cartera",
      markets: "Mercados",
      aiAsset: "IA activos",
      aiSimulator: "Simulador",
      aiTrading: "Trading IA",
      aiAssistant: "Asistente IA",
      transactions: "Transacciones",
      settings: "Configuracion",
      adminAssets: "Admin - Activos",
      adminUsers: "User management",
      adminMessages: "Mensajes de usuarios",
      messages: "Mensajes",
      withdraw: enLocale.nav.withdraw,
    },
    header: {
      searchPlaceholder: "Buscar un activo... (⌘K)",
      searchNoResults: "No se encontraron valores",
      logout: "Cerrar sesion",
      admin: "Admin",
      investor: "Inversor",
      stndChipLabel: enLocale.header.stndChipLabel,
      stndUnit: enLocale.header.stndUnit,
    },
    sidebar: { proVersion: "Version Pro", advancedInsights: "Accede a analiticas avanzadas", upgrade: "Pasar a Pro" },
    pages: {
      dashboard: {
        title: "Panel",
        subtitle: "Resumen de tu cartera de inversion",
        statLabels: {
          totalValue: "Valor total",
          profitLoss: "Ganancia/Pérdida",
          assetsCount: "Cantidad de activos",
          performance: "Rendimiento",
        },
        statChanges: {
          thisMonth: "Este mes",
          assetsDifferent: "Activos diferentes",
          over7Months: "En 7 meses",
        },
        totalValueBreakdownAssets: "Activos",
        totalValueBreakdownCash: "Efectivo",
        totalValueInfoAria: "Desglose: activos de mercado y saldo en efectivo",
        chart: {
          portfolioTitle: "Rendimiento de la cartera",
          portfolioSubtitle: "Evolución en los últimos 7 meses",
          distributionTitle: "Distribución",
          distributionSubtitle: "Por tipo de activo",
          tooltipValueLabel: "Valor",
          donutTotalLabel: "Valor de los activos",
          distributionTooltipInvestedShare: "del portafolio invertido",
        },
        performanceMonths: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul"],
        assetTypes: {
          stock: "Acciones",
          crypto: "Criptomonedas",
          etf: "ETF",
        },
        table: {
          topPerformances: "Mejores rendimientos",
          asset: "Activo",
          quantity: "Cantidad",
          purchasePrice: "Precio de compra",
          currentPrice: "Precio actual",
          gainLoss: "Ganancia/Pérdida",
        },
      },
      portfolio: {
        title: "Mi Cartera",
        subtitle: "Gestiona tus activos y sigue su rendimiento",
        buyAsset: "Comprar un activo",
        loadAccount: "Cargar cuenta",
        sell: "Vender",
        noTransactions: "No se encontraron transacciones",
        insufficientStnd: enLocale.pages.portfolio.insufficientStnd,
        withdraw: enLocale.pages.portfolio.withdraw,
      },
      loadAccount: {
        title: "Cargar cuenta",
        subtitle: "Agrega fondos a tu saldo",
        amountLabel: "Monto (TND)",
        quickSelect: "Seleccion rapida",
        paymentMethod: "Metodo de pago",
        enterAmount: "Ingresa un monto positivo",
        confirmPayment: "Confirmar pago",
        successMessage: "Fondos agregados con exito",
        trial: "Prueba gratuita de 7 dias",
        ...enLocale.pages.loadAccount,
      },
      withdraw: enLocale.pages.withdraw,
      wallet: enLocale.pages.wallet,
      markets: {
        title: "Mercados",
        subtitle: "Sigue el rendimiento del mercado en tiempo real",
        searchPlaceholder: "Buscar un activo...",
        all: "Todos",
        stocks: "Acciones",
        crypto: "Cripto",
        favorites: "Favoritos",
        clearFilters: "Borrar filtros",
        noMatchFilters: "Ningun valor coincide con tus filtros",
      },
      aiAsset: {
        title: "Explicador IA de activos",
        subtitle: "Lenguaje sencillo para entender un activo antes de profundizar",
        searchPlaceholder: "Nombre o ticker (ej. BIAT, BTC)...",
        explain: "Ver explicacion",
        cardWhat: "En pocas palabras",
        cardRisk: "Riesgo (lectura sencilla)",
        cardWhy: "Motivos habituales para invertir",
        disclaimer: "Aviso: contenido educativo, no asesoramiento personal.",
        loading: "Generando explicacion...",
        loadingAssets: "Cargando activos...",
        pickAsset: "Elige un activo de la lista o busca por ticker.",
        error: "No se pudo cargar. Revisa la API o intentalo de nuevo.",
      },
      aiTradingPage: {
        moduleLabel: "Trading IA",
        title: "Trading IA",
        subtitle: "Gestiona tus bots de trading automatizado y sigue la actividad en tiempo real.",
        newBot: "Nuevo bot",
        verificationRequired: "Verifica tu correo para acceder al trading.",
        activeBotsHeading: "Bots activos",
        loading: "Cargando...",
        emptyBots: "No hay bots.",
        pnlTitle: "P&L neto",
        pnlSubtitle: "Ganancias y pérdidas acumuladas de tus bots",
        socketStream: "Flujo de operaciones en vivo",
        controlPanelTitle: "Panel de control",
        selectedBot: "Bot seleccionado:",
        modeManual: "Manual",
        modeAiStrategy: "Estrategia IA",
        transactionsPerDay: "tx/día",
        start: "Iniciar",
        pause: "Pausa",
        stopHard: "Parada forzada",
        realizedLossToday: "Pérdida realizada hoy:",
        operationsFeedTitle: "Flujo de operaciones",
        marketBannerUnavailable: "Historial no disponible para este bot.",
        feedLoading: "Cargando flujo...",
        feedEmpty: "No hay operaciones registradas.",
        tableHeaderAsset: "Activo",
        tableHeaderAction: "Acción",
        tableHeaderAmount: "Importe",
        tableHeaderResult: "Resultado",
        tableHeaderTime: "Hora",
        actionBuy: "Compra",
        actionSell: "Venta",
        statusSuccess: "Éxito",
        statusPending: "Pendiente",
        statusFailed: "Fallido",
        loadBotsError: "No se pudieron cargar los bots.",
        loadFeedError: "No se pudo cargar el historial del bot.",
        dailyLossLimitReached: "Límite de pérdida diario alcanzado: el bot se ha detenido.",
        botStartedToast: "Bot iniciado.",
        botPausedToast: "Bot en pausa.",
        botStoppedToast: "Bot detenido.",
        actionFailed: "Acción fallida.",
      },
      aiTradingWizard: {
        title: "Asistente de creacion — bot de trading IA",
        description: "Creacion guiada de un bot con controles de riesgo y condiciones de compra/venta.",
        botNameLabel: "Nombre del bot",
        botNamePlaceholder: "ej. Estrategia BVMT conservadora",
        modeLabel: "Modo",
        manualStrategy: "Estrategia manual",
        manualStrategyHint: "Reglas explicitas (% umbral, precio...)",
        aiStrategy: "Estrategia IA",
        aiStrategyHint: "Puntuacion ponderada (tendencia, volatilidad...)",
        maxAllocationLabel: "Asignacion max por operacion (TND)",
        maxTransactionsLabel: "Transacciones max / dia",
        riskLevelLabel: "Nivel de riesgo",
        riskLow: "Bajo",
        riskMedium: "Medio",
        riskHigh: "Alto",
        assetSymbolLabel: "Activo (simbolo)",
        assetPlaceholder: "— Elegir un activo —",
        assetEmptyLabel: "Ningun activo coincide con el filtro actual de Mercados. Ajusta los filtros en la pagina Mercados.",
        assetRequiredHint: "Por favor elige un activo para continuar.",
        buyConditionLabel: "Condicion de compra",
        buyConditionPercentage: "% caída",
        buyConditionPrice: "Precio max",
        buyConditionAiSignal: "Senal IA",
        buyThresholdLabel: "Umbral de compra (% o precio TND segun el modo)",
        reinforceWithAiSignal: "Reforzar con senal IA (modo manual)",
        takeProfitLabel: "Take profit (%)",
        stopLossLabel: "Stop loss (%)",
        useAiExitLabel: "Salida asistida por IA",
        riskWarningTitle: "Advertencia de riesgo",
        riskWarningBody:
          "El trading automatizado conlleva un riesgo de perdida de capital. El rendimiento pasado no garantiza resultados futuros. El motor depende de datos de mercado que pueden no estar disponibles o retrasados.",
        riskScoreTitle: "Puntuacion de riesgo estimada (indicativa)",
        riskScoreSubtitle: "Basado en el tope por operacion, el nivel de riesgo y la frecuencia maxima.",
        summaryNameLabel: "Nombre:",
        summaryModeLabel: "Modo:",
        summaryMaxTradeLabel: "Max / operacion:",
        summaryAssetLabel: "Activo:",
        confirmRiskLabel:
          "Confirmo haber leido la advertencia y aceptar que iniciar el bot es mi responsabilidad.",
        back: "Atras",
        next: "Siguiente",
        createBot: "Crear bot",
        creating: "Creando...",
        errorChooseAsset: "Elige un activo antes de continuar.",
        errorChooseAssetSymbol: "Elige un simbolo de activo.",
        errorConfirmRisk: "Debes confirmar que entiendes los riesgos.",
        successCreated: "Bot creado. Puedes iniciarlo desde el panel de control.",
        errorCreationFailed: "Creacion fallida",
      },
      simulator: {
        title: "Simulador de inversion",
        subtitle: "Proyeccion de aportes mensuales: el retorno anual se estima desde tu cartera y datos de mercado (Yahoo Finance).",
        monthlyLabel: "Inversion mensual (TND)",
        yearsLabel: "Horizonte de simulacion (anos)",
        portfolioBasisLabel: "Basado en tu cartera actual y el historial de mercado",
        disclaimerPastPerformance: "El rendimiento pasado no garantiza resultados futuros.",
        loadingExpectedReturn: "Calculando retorno esperado desde tu cartera...",
        portfolioUnavailable:
          "No se pudo estimar el retorno (cartera vacia o datos no disponibles). Anade posiciones o activa retorno personalizado.",
        breakdownHeading: "Desglose por linea",
        breakdownWeight: "Peso",
        breakdownReturn: "Retorno anualizado estimado",
        estimatedAnnualReturn: "Retorno anual estimado de la cartera",
        customReturnToggle: "Usar retorno personalizado (manual)",
        customReturnLabel: "Retorno anual personalizado (%)",
        run: "Calcular y explicar",
        loading: "Calculando...",
        emptyHint: "Completa los campos y ejecuta la simulacion.",
        invalidNumbers: "Valores numericos invalidos.",
        finalValue: "Saldo final proyectado",
        contributed: "Total aportado",
        gain: "Crecimiento sobre aportes",
        chartTitle: "Trayectoria proyectada",
        chartProjected: "Saldo proyectado",
        chartContributed: "Aportes acumulados",
        year0: "Inicio",
        yearPrefix: "Ano",
        aiTitle: "Explicacion",
        error: "No se pudo llamar a la API. Arranca el backend (npm run dev:all).",
        footerNote:
          "Supuesto: mismo monto a fin de mes, tasa nominal anual, capitalizacion mensual. Las proyecciones no garantizan resultados futuros.",
      },
      transactions: { title: "Transacciones", subtitle: "Historial completo de tus transacciones", totalBuy: "Total de compras", totalSell: "Total de ventas", totalTransactions: "Total transacciones", fromStart: "Desde el inicio" },
      settings: { title: "Configuracion", subtitle: "Gestiona tus preferencias y seguridad", preferences: "Preferencias", language: "Idioma", currency: "Moneda", timezone: "Zona horaria" },
      admin: { title: "Administracion de activos", subtitle: "Agrega activos (con API de precio) y elimina los que ya no deben estar disponibles." },
      adminDashboard: {
        subtitle: "Herramientas de administracion: usuarios, activos y mensajeria de soporte.",
      },
      adminUsersPage: {
        title: "User management",
        subtitle: "Accounts, login risk and automatic lockouts.",
        loadError: "Could not load users.",
        empty: "No users.",
        colName: "Name",
        colEmail: "Email",
        colLastActive: "Last active",
        colStatus: "Status",
        colRisk: "Risk",
        colActions: "Actions",
        statusActive: "Active",
        statusLocked: "Locked",
        riskBadgeLow: "Low",
        riskBadgeMid: "Watch",
        riskBadgeHigh: "Critical",
        view: "View",
        delete: "Delete",
        unlock: "Unlock",
        prev: "Previous",
        next: "Next",
        pageLabel: "Page",
        detailTitle: "User profile",
        roleInvestor: "Investor",
        rolePro: "Pro",
        failedAttempts: "Failed password attempts",
        lockReason: "Lock reason",
        confirmDeleteTitle: "Confirm deletion",
        confirmDeleteBody: "Archive this user? The account will be soft-deleted.",
        cancel: "Cancel",
        confirm: "Confirm",
        deletedToast: "User archived.",
        unlockedToast: "Account unlocked.",
        neverActive: "Never",
        close: "Close",
      },
      home: {
        brand: "INVESTPRO",
        heroTitle: "Take full control of your money with ease",
        heroSubtitle: "Track spending, compare performance, and unlock premium insights.",
        cta: "Get Started For Free",
        previewLabel: "Dashboard preview",
        previewTitle: "Immersive finance control",
        connected: "Connected",
        balance: "Balance",
        availableFunds: "Available funds",
        income: "Income",
        last30Days: "Last 30 days",
        signal: "Signal",
        portfolioMomentum: "Portfolio momentum",
        insights: "Insights",
        healthForecast: "Portfolio health & forecast",
        premium: "Premium",
        spendRate: "Spend rate",
        riskLevel: "Risk level",
        low: "Low",
        aiInsights: "AI insights",
        automatedGuidance: "Automated portfolio guidance",
        automatedGuidanceDesc: "Intelligent recommendations help you move faster.",
        secure: "Secure",
        enterpriseProtection: "Enterprise-grade protection",
        enterpriseProtectionDesc: "Multi-layer encryption and access controls.",
        design: "Design",
        immersiveUi: "Minimal, immersive UI",
        immersiveUiDesc: "Clean layouts and subtle motion for premium experiences.",
        deepInsights: "Deep insights",
        precisionHeadline: "Built for investors who want precision",
        precisionSubheadline: "Powerful analytics and elegant controls to act with confidence.",
        precisionTracking: "Precision tracking",
        precisionTrackingDesc: "Monitor every position with crisp metrics.",
        adaptiveAlerts: "Adaptive alerts",
        adaptiveAlertsDesc: "Stay ahead with real-time signals.",
        glowingPerformance: "Glowing performance",
        glowingPerformanceDesc: "Visualize growth with clean charts and soft glow accents.",
        nextLevelControl: "Next-level control",
        longerPageTitle: "A longer page to explore premium capabilities",
        longerPageDesc: "Discover advanced fintech tools and a polished interface.",
        monthlyVolume: "Monthly volume",
        conversion: "Conversion",
        retention: "Retention",
      },
      login: {
        title: "Iniciar sesion",
        subtitle: "Accede a tu cartera de inversion",
        createAccount: "Crear cuenta",
        emailOrPasswordInvalid: "Correo o contrasena incorrectos",
        emailLabel: "Email",
        passwordLabel: "Contrasena",
        showPasswordAria: "Mostrar contrasena",
        hidePasswordAria: "Ocultar contrasena",
        rememberMe: "Recordarme",
        forgotPassword: "Olvidaste tu contrasena?",
        signIn: "Iniciar sesion",
        noAccount: "Aun no tienes cuenta?",
        demoPrefix: "Cuenta del servidor:",
        demoBody:
          "Solo usuarios registrados en esta API (registro + codigo por correo). En desarrollo el backend crea: investor.demo@example.com / Invest#demo1, admin@example.com / Admin#demo1 y pro.demo@example.com / Pro#demo1 (Pro Investor).",
        realtimeTitle: "Datos en tiempo real",
        realtimeDesc: "Sigue precios en vivo y movimientos del mercado.",
        securityTitle: "Seguridad maxima",
        securityDesc: "Tus datos estan protegidos con cifrado moderno.",
      },
      register: {
        title: "Crear cuenta",
        subtitle: "Completa tus datos para continuar",
        success: "Cuenta creada con exito. Ahora puedes iniciar sesion.",
        passwordInvalid: "La contrasena no cumple todos los requisitos.",
        under18: "Registro denegado: debes tener al menos 18 anos.",
        familyName: "Apellido",
        name: "Nombre",
        dateOfBirth: "Fecha de nacimiento",
        email: "Email",
        password: "Contrasena",
        createMyAccount: "Crear mi cuenta",
        alreadyHaveAccount: "Ya tienes una cuenta?",
        performanceTitle: "Seguimiento de rendimiento",
        performanceDesc: "Analiza tus inversiones con indicadores claros.",
        protectionTitle: "Proteccion de cuenta",
        protectionDesc: "Usa una contrasena fuerte para proteger tus datos.",
        passwordRuleLetter: "Al menos una letra",
        passwordRuleNumber: "Al menos un numero",
        passwordRuleSymbol: "Al menos un simbolo",
        passwordRuleLength: "Minimo 8 caracteres",
        showPasswordCheckboxLabel: "Mostrar contrasena",
      },
      forgotPassword: {
        title: "Olvide mi contrasena",
        subtitle: "Te enviaremos un codigo de 6 digitos por correo.",
        emailLabel: "Email",
        sendCode: "Enviar codigo",
        successHint: "Si existe una cuenta, revisa tu correo para el codigo de restablecimiento.",
        backToLogin: "Volver al inicio de sesion",
        continueToReset: "Establecer nueva contrasena",
      },
      resetPassword: {
        title: "Nueva contrasena",
        subtitle: "Introduce el codigo del correo y elige una nueva contrasena.",
        codeLabel: "Codigo de 6 digitos",
        newPasswordLabel: "Nueva contrasena",
        resetButton: "Restablecer contrasena",
        successToast: "Contrasena actualizada. Ya puedes iniciar sesion.",
        backToLogin: "Volver al inicio de sesion",
        invalidCode: "Codigo invalido o caducado. Solicita uno nuevo.",
        missingEmail: "Primero usa olvide mi contrasena e indica tu email.",
      },
      upgrade: {
        heroBadge: "Actualizacion Premium",
        heroTitle: "Impulsa tu cartera con Pro",
        heroSubtitle: "Desbloquea analiticas avanzadas y una experiencia de trading mejorada.",
        whatYouGet: "Lo que obtienes",
        whatYouGetPoints: ["Analiticas de rendimiento avanzadas", "Soporte prioritario", "Flujo de pago seguro"],
        stepLabels: {
          step: "Paso {step} de 4",
          planSelection: "Seleccion de plan",
          paymentMethod: "Metodo de pago",
          details: "Detalles",
          review: "Revision",
        },
        planNames: { monthly: "Plan mensual", yearly: "Plan anual" },
        planPrices: { monthly: "20 TND / mes", yearly: "200 TND / ano" },
        planHighlights: { yearly: "Ahorra 40 TND" },
        planDetails: {
          flexibleMonthlyBilling: "Facturacion mensual flexible",
          cancelAnytime: "Cancelar en cualquier momento",
          bestValue: "Mejor valor para miembros anuales",
          twoMonthsFree: "2 meses gratis",
        },
        trialLabel: "Prueba gratuita de 7 dias",
        selectedLabel: "Seleccionado",
        paymentMethods: { card: "Pago con tarjeta", d17: "Pago movil D17" },
        paymentMethodDescriptions: { card: "Visa, Mastercard o tarjeta local", d17: "Pago movil tunisino via D17" },
        cardNumber: "Numero de tarjeta",
        expiryDate: "Fecha de expiracion",
        cvv: "CVV",
        nameOnCard: "Nombre en la tarjeta",
        phoneNumber: "Numero de telefono",
        phonePlaceholder: "+216 9xx xxx xxx",
        phoneHelp: "Se enviara un enlace de pago seguro a su telefono.",
        selectedPlanLabel: "Plan seleccionado",
        billedMonthly: "Facturado mensualmente a 20 TND",
        billedYearly: "Facturado anualmente a 200 TND",
        summaryTitle: "Resumen",
        summaryPaymentMethod: "Metodo de pago",
        summaryTrial: "Prueba gratuita de 7 dias incluida",
        securePaymentTitle: "Pago seguro",
        securePaymentCopy: "Su informacion esta protegida con cifrado de nivel industrial.",
        premiumBenefitsTitle: "Beneficios Premium",
        premiumBenefitsPoints: ["Analiticas avanzadas", "Soporte prioritario", "Incorporacion segura"],
        back: "Volver",
        continue: "Continuar",
        startFreeTrial: "Iniciar prueba gratuita",
        payViaD17: "Pagar via D17",
        confirmPayment: "Confirmar pago",
        d17Checkout: {
          title: "Pago D17",
          subtitle: "Completa el pago en la app D17 en tu telefono.",
          stepsTitle: "Pasos",
          step1: "Abre la app D17 e inicia sesion.",
          step2: "Envia el importe indicado a la cuenta comerciante InvestPro (datos por correo o soporte).",
          step3: "Usa tu correo o el telefono de abajo como referencia para vincular el pago.",
          amountLabel: "Importe a pagar",
          planLabel: "Plan",
          phoneLabel: "Telefono introducido",
          footerNote: "La activacion puede tardar hasta 24 h. Contacta soporte desde Mensajes si lo necesitas.",
          backToUpgrade: "Cambiar plan",
          goDashboard: "Volver al panel",
          confirmPaidActivate: "Ya pagué — activar Pro",
          invalidSession: "Sesion de pago ausente. Vuelve a empezar desde upgrade.",
          retryUpgrade: "Volver a upgrade",
        },
        cardNumberPlaceholder: "1234 5678 9012 3456",
        expiryPlaceholder: "MM/AA",
        cvvPlaceholder: "123",
        cardholderNamePlaceholder: "Nombre del titular",
        cardTypes: { visa: "Visa", mastercard: "Mastercard", amex: "American Express", discover: "Discover", unknown: "Tarjeta" },
        validation: {
          requiredField: "Campo requerido",
          invalidCardNumber: "Número de tarjeta inválido",
          invalidCardNumberLength: "El número de tarjeta debe tener entre 13 y 19 dígitos",
          invalidExpiryFormat: "Fecha de vencimiento inválida",
          cardExpired: "La tarjeta expiró",
          invalidCvv: "CVV inválido",
          invalidCardholderName: "Nombre de titular inválido",
        },
      },
      messages: {
        title: "Mensajes",
        subtitle: "Contacta con el equipo InvestPro",
        contactAdmin: "Contactar admin",
        modalTitle: "Nueva conversación",
        subjectOptional: "Asunto (opcional)",
        subjectPlaceholder: "Motivo de tu consulta",
        messageLabel: "Mensaje",
        messagePlaceholder: "Describe tu consulta…",
        send: "Enviar",
        cancel: "Cancelar",
        noConversations: "Aún no hay conversaciones.",
        selectConversation: "Elige una conversación en la lista.",
        closedHint: "Esta conversación está cerrada.",
        placeholderReply: "Escribe tu mensaje…",
        loadingList: "Cargando…",
        loadingThread: "Cargando mensajes…",
        unread: "Sin leer",
        adminLabel: "Soporte InvestPro",
        youLabel: "Tú",
        verifyRequired: "Verifica tu correo para usar la mensajería.",
        adminTitle: "Mensajes de usuarios",
        adminSubtitle: "Conversaciones de inversores y respuestas admin",
        colUser: "Usuario",
        colRole: "Rol",
        colLastMessage: "Último mensaje",
        colStatus: "Estado",
        colUnread: "No leídos",
        filterStatus: "Estado",
        filterRole: "Rol",
        filterAll: "Todos",
        closeConversation: "Cerrar",
        reopenConversation: "Reabrir",
        statusOpen: "Abierta",
        statusClosed: "Cerrada",
        roleInvestor: "Inversor",
        rolePro: "Pro",
        backToList: "Volver al listado",
        sentToast: "Mensaje enviado",
        sendError: "No se pudo enviar",
        createdToast: "Conversación creada",
      },
      aiAssistant: {
        title: "Asistente IA",
        subtitle: "Preguntas sobre acciones con datos de la plataforma.",
        placeholder: "Pregunta por una acción (ej. «¿Va SUB estrella alcista hoy?»)",
        attachStock: "Adjuntar activo",
        send: "Enviar",
        newChat: "Nueva conversación",
        historyTitle: "Historial",
        noConversations: "Sin conversaciones guardadas.",
        emptyThreadHint: "Haz una pregunta o adjunta un símbolo.",
        lockedTitle: "Asistente IA solo para Pro",
        lockedSubtitle: "Pásate a Pro para usar datos en vivo e históricos.",
        upgradeCta: "Pasarse a Pro",
        retry: "Reintentar",
        sendError: "No se pudo obtener respuesta.",
        stockPickerTitle: "Elegir activo",
        stockSearch: "Buscar símbolo o nombre…",
        pick: "Seleccionar",
        attachedPrefix: "Contexto",
        clearStock: "Quitar",
        typing: "La IA está pensando",
        deleteConversation: "Eliminar",
        deleteConversationAria: "Eliminar esta conversación",
        deleteConversationConfirm: "¿Eliminar esta conversación? No se puede deshacer.",
        deleteConversationError: "No se pudo eliminar la conversación.",
      },
      proFeature: {
        modalTitle: "Función Pro",
        modalSubtitle: "Actualiza a Pro para desbloquear Trading IA y el simulador avanzado.",
        upgradeCta: "Pasarse a Pro",
        badgePro: "Pro",
        previewFeatures: [
          "Bots de trading IA con reglas y límites diarios",
          "Simulador de proyección con rendimiento esperado",
          "Canal en tiempo real seguro (Socket.io)",
        ],
        lockHint: "Disponible para cuentas Pro Investor.",
      },
    },
  },
  de: {
    languageName: "Deutsch",
    nav: {
      dashboard: "Dashboard",
      portfolio: "Portfolio",
      markets: "Markte",
      aiAsset: "KI-Assets",
      aiSimulator: "Simulator",
      aiTrading: "KI-Trading",
      aiAssistant: "KI-Assistent",
      transactions: "Transaktionen",
      settings: "Einstellungen",
      adminAssets: "Admin - Assets",
      adminUsers: "User management",
      adminMessages: "Nutzer-Nachrichten",
      messages: "Nachrichten",
      withdraw: enLocale.nav.withdraw,
    },
    header: {
      searchPlaceholder: "Asset suchen... (⌘K)",
      searchNoResults: "Keine Titel gefunden",
      logout: "Abmelden",
      admin: "Admin",
      investor: "Investor",
      stndChipLabel: enLocale.header.stndChipLabel,
      stndUnit: enLocale.header.stndUnit,
    },
    sidebar: { proVersion: "Pro Version", advancedInsights: "Erweiterte Analysen nutzen", upgrade: "Zu Pro wechseln" },
    pages: {
      dashboard: {
        title: "Dashboard",
        subtitle: "Übersicht Ihres Anlageportfolios",
        statLabels: {
          totalValue: "Gesamtwert",
          profitLoss: "Gewinn/Verlust",
          assetsCount: "Anzahl Assets",
          performance: "Performance",
        },
        statChanges: {
          thisMonth: "Diesen Monat",
          assetsDifferent: "Verschiedene Assets",
          over7Months: "In 7 Monaten",
        },
        totalValueBreakdownAssets: "Vermögenswerte",
        totalValueBreakdownCash: "Bargeld",
        totalValueInfoAria: "Aufschlüsselung: Marktassets und Barguthaben",
        chart: {
          portfolioTitle: "Portfolio-Performance",
          portfolioSubtitle: "Entwicklung in den letzten 7 Monaten",
          distributionTitle: "Verteilung",
          distributionSubtitle: "Nach Asset-Typ",
          tooltipValueLabel: "Wert",
          donutTotalLabel: "Wert der Vermögenswerte",
          distributionTooltipInvestedShare: "des investierten Portfolios",
        },
        performanceMonths: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul"],
        assetTypes: {
          stock: "Aktien",
          crypto: "Kryptowährungen",
          etf: "ETF",
        },
        table: {
          topPerformances: "Top-Performances",
          asset: "Asset",
          quantity: "Menge",
          purchasePrice: "Kaufpreis",
          currentPrice: "Aktueller Preis",
          gainLoss: "Gewinn/Verlust",
        },
      },
      portfolio: {
        title: "Mein Portfolio",
        subtitle: "Verwalten Sie Ihre Assets und verfolgen Sie die Performance",
        buyAsset: "Asset kaufen",
        loadAccount: "Konto laden",
        sell: "Verkaufen",
        noTransactions: "Keine Transaktionen gefunden",
        insufficientStnd: enLocale.pages.portfolio.insufficientStnd,
        withdraw: enLocale.pages.portfolio.withdraw,
      },
      loadAccount: {
        title: "Konto laden",
        subtitle: "Fugen Sie Mittel zu Ihrem Guthaben hinzu",
        amountLabel: "Betrag (TND)",
        quickSelect: "Schnellauswahl",
        paymentMethod: "Zahlungsmethode",
        enterAmount: "Geben Sie einen positiven Betrag ein",
        confirmPayment: "Zahlung bestätigen",
        successMessage: "Mittel erfolgreich hinzugefügt",
        trial: "7-tägige kostenlose Testversion",
        ...enLocale.pages.loadAccount,
      },
      withdraw: enLocale.pages.withdraw,
      wallet: enLocale.pages.wallet,
      markets: {
        title: "Markte",
        subtitle: "Marktentwicklung in Echtzeit verfolgen",
        searchPlaceholder: "Asset suchen...",
        all: "Alle",
        stocks: "Aktien",
        crypto: "Krypto",
        favorites: "Favoriten",
        clearFilters: "Filter zurucksetzen",
        noMatchFilters: "Keine Werte entsprechen deinen Filtern",
      },
      aiAsset: {
        title: "KI-Asset-Erklarer",
        subtitle: "Einfache Sprache, bevor Sie tiefer gehen",
        searchPlaceholder: "Name oder Kürzel (z. B. BIAT, BTC)...",
        explain: "Erklarung holen",
        cardWhat: "Kurz erklart",
        cardRisk: "Risiko (einfach)",
        cardWhy: "Warum investieren Menschen",
        disclaimer: "Hinweis: Bildung — keine persönliche Anlageberatung.",
        loading: "Erklarung wird erstellt...",
        loadingAssets: "Assets werden geladen...",
        pickAsset: "Wahlen Sie ein Asset oder suchen Sie per Kürzel.",
        error: "Laden fehlgeschlagen. API prufen oder erneut versuchen.",
      },
      aiTradingPage: {
        moduleLabel: "KI-Trading",
        title: "KI-Trading",
        subtitle: "Verwalten Sie Ihre automatisierten Trading-Bots und beobachten Sie Aktivitäten in Echtzeit.",
        newBot: "Neuer Bot",
        verificationRequired: "Bestätigen Sie Ihre E-Mail, um mit dem Trading fortzufahren.",
        activeBotsHeading: "Aktive Bots",
        loading: "Laden...",
        emptyBots: "Keine Bots gefunden.",
        pnlTitle: "Netto P&L",
        pnlSubtitle: "Kumulierte Gewinne und Verluste Ihrer Bots",
        socketStream: "Live-Operations-Stream",
        controlPanelTitle: "Steuerzentrale",
        selectedBot: "Ausgewählter Bot:",
        modeManual: "Manuell",
        modeAiStrategy: "KI-Strategie",
        transactionsPerDay: "tx/Tag",
        start: "Start",
        pause: "Pause",
        stopHard: "Harter Stopp",
        realizedLossToday: "Realisiert heute:",
        operationsFeedTitle: "Operations-Stream",
        marketBannerUnavailable: "Verlauf für diesen Bot nicht verfügbar.",
        feedLoading: "Stream wird geladen...",
        feedEmpty: "Keine Operationen vorhanden.",
        tableHeaderAsset: "Asset",
        tableHeaderAction: "Aktion",
        tableHeaderAmount: "Betrag",
        tableHeaderResult: "Ergebnis",
        tableHeaderTime: "Zeit",
        actionBuy: "Kaufen",
        actionSell: "Verkaufen",
        statusSuccess: "Erfolg",
        statusPending: "Ausstehend",
        statusFailed: "Fehlgeschlagen",
        loadBotsError: "Bots konnten nicht geladen werden.",
        loadFeedError: "Bot-Verlauf konnte nicht geladen werden.",
        dailyLossLimitReached: "Tägliches Verlustlimit erreicht: Der Bot wurde gestoppt.",
        botStartedToast: "Bot gestartet.",
        botPausedToast: "Bot pausiert.",
        botStoppedToast: "Bot gestoppt.",
        actionFailed: "Aktion fehlgeschlagen.",
      },
      aiTradingWizard: {
        title: "Erstellungsassistent — KI-Trading-Bot",
        description: "Geführte Bot-Erstellung mit Risikokontrollen und Kauf-/Verkaufsbedingungen.",
        botNameLabel: "Bot-Name",
        botNamePlaceholder: "z.B. Konservative BVMT-Strategie",
        modeLabel: "Modus",
        manualStrategy: "Manuelle Strategie",
        manualStrategyHint: "Explizite Regeln (% Schwelle, Preis...)",
        aiStrategy: "KI-Strategie",
        aiStrategyHint: "Gewichtete Bewertung (Trend, Volatilität...)",
        maxAllocationLabel: "Maximale Zuordnung pro Trade (TND)",
        maxTransactionsLabel: "Maximale Transaktionen pro Tag",
        riskLevelLabel: "Risikostufe",
        riskLow: "Niedrig",
        riskMedium: "Mittel",
        riskHigh: "Hoch",
        assetSymbolLabel: "Asset (Symbol)",
        assetPlaceholder: "— Wähle ein Asset —",
        assetEmptyLabel: "Keine Assets stimmen mit dem aktuellen Marktfiler überein. Passe die Filter auf der Seite Märkte an.",
        assetRequiredHint: "Bitte wähle ein Asset, um fortzufahren.",
        buyConditionLabel: "Kaufbedingung",
        buyConditionPercentage: "% Rückgang",
        buyConditionPrice: "Maximalpreis",
        buyConditionAiSignal: "KI-Signal",
        buyThresholdLabel: "Kaufschwelle (% oder TND-Preis je nach Modus)",
        reinforceWithAiSignal: "Mit KI-Signal verstärken (manueller Modus)",
        takeProfitLabel: "Take profit (%)",
        stopLossLabel: "Stop loss (%)",
        useAiExitLabel: "KI-unterstützter Ausstieg",
        riskWarningTitle: "Risikohinweis",
        riskWarningBody:
          "Automatisierter Handel birgt das Risiko eines Kapitalverlusts. Vergangene Performance garantiert keine zukünftigen Ergebnisse. Die Engine nutzt Marktdaten, die nicht verfügbar oder verzögert sein können.",
        riskScoreTitle: "Geschätzte Risikobewertung (indikativ)",
        riskScoreSubtitle: "Basierend auf Maximalallokation pro Trade, Risikostufe und Frequenzbegrenzung.",
        summaryNameLabel: "Name:",
        summaryModeLabel: "Modus:",
        summaryMaxTradeLabel: "Max / Trade:",
        summaryAssetLabel: "Asset:",
        confirmRiskLabel:
          "Ich bestätige, dass ich die Warnung gelesen habe und akzeptiere, dass das Starten des Bots in meiner Verantwortung liegt.",
        back: "Zurück",
        next: "Weiter",
        createBot: "Bot erstellen",
        creating: "Erstelle...",
        errorChooseAsset: "Wähle ein Asset, um fortzufahren.",
        errorChooseAssetSymbol: "Wähle ein Asset-Symbol.",
        errorConfirmRisk: "Du musst bestätigen, dass du die Risiken verstanden hast.",
        successCreated: "Bot erstellt. Du kannst ihn im Kontrollpanel starten.",
        errorCreationFailed: "Erstellung fehlgeschlagen",
      },
      simulator: {
        title: "Investment-Simulator",
        subtitle: "Monatliche Sparprojektion: die Jahresrendite wird aus Ihrem Portfolio und Marktdaten (Yahoo Finance) geschatzt.",
        monthlyLabel: "Monatliche Sparrate (TND)",
        yearsLabel: "Simulationshorizont (Jahre)",
        portfolioBasisLabel: "Basierend auf Ihrem aktuellen Portfolio und Markthistorie",
        disclaimerPastPerformance: "Vergangene Performance garantiert keine zukunftigen Ergebnisse.",
        loadingExpectedReturn: "Erwartete Rendite aus Ihrem Portfolio wird berechnet...",
        portfolioUnavailable:
          "Rendite nicht schatzbar (leeres Portfolio oder keine Daten). Positionen hinzufugen oder manuelle Rendite nutzen.",
        breakdownHeading: "Aufschlusselung je Position",
        breakdownWeight: "Gewicht",
        breakdownReturn: "Geschatzte annualisierte Rendite",
        estimatedAnnualReturn: "Geschatzte Portfolio-Jahresrendite",
        customReturnToggle: "Eigene Rendite verwenden (manuelle Uberschreibung)",
        customReturnLabel: "Individuelle Jahresrendite (%)",
        run: "Berechnen und erklaren",
        loading: "Berechnung...",
        emptyHint: "Felder ausfullen und Simulation starten.",
        invalidNumbers: "Ungultige Zahlen.",
        finalValue: "Projiziertes Endkapital",
        contributed: "Summe der Einzahlungen",
        gain: "Wachstum uber Einzahlungen",
        chartTitle: "Projizierter Verlauf",
        chartProjected: "Projiziertes Guthaben",
        chartContributed: "Kumulierte Einzahlungen",
        year0: "Start",
        yearPrefix: "Jahr",
        aiTitle: "Erklarung",
        error: "API nicht erreichbar. Backend starten (npm run dev:all).",
        footerNote:
          "Annahme: gleicher Betrag jeweils Monatsende, nominaler Jahreszins, monatliche Verzinsung. Keine Garantie fur die Zukunft.",
      },
      transactions: { title: "Transaktionen", subtitle: "Vollstandiger Verlauf Ihrer Transaktionen", totalBuy: "Gesamte Kaufe", totalSell: "Gesamte Verkaufe", totalTransactions: "Gesamttransaktionen", fromStart: "Seit Beginn" },
      settings: { title: "Einstellungen", subtitle: "Verwalten Sie Ihre Einstellungen und Sicherheit", preferences: "Prafenzen", language: "Sprache", currency: "Wahrung", timezone: "Zeitzone" },
      admin: { title: "Asset-Verwaltung", subtitle: "Fugen Sie Assets hinzu (mit Preis-API) und entfernen Sie nicht mehr verfugbare Assets." },
      adminDashboard: {
        subtitle: "Admin-Tools: Nutzerkonten, notierte Assets und Support-Messaging.",
      },
      adminUsersPage: {
        title: "User management",
        subtitle: "Accounts, login risk and automatic lockouts.",
        loadError: "Could not load users.",
        empty: "No users.",
        colName: "Name",
        colEmail: "Email",
        colLastActive: "Last active",
        colStatus: "Status",
        colRisk: "Risk",
        colActions: "Actions",
        statusActive: "Active",
        statusLocked: "Locked",
        riskBadgeLow: "Low",
        riskBadgeMid: "Watch",
        riskBadgeHigh: "Critical",
        view: "View",
        delete: "Delete",
        unlock: "Unlock",
        prev: "Previous",
        next: "Next",
        pageLabel: "Page",
        detailTitle: "User profile",
        roleInvestor: "Investor",
        rolePro: "Pro",
        failedAttempts: "Failed password attempts",
        lockReason: "Lock reason",
        confirmDeleteTitle: "Confirm deletion",
        confirmDeleteBody: "Archive this user? The account will be soft-deleted.",
        cancel: "Cancel",
        confirm: "Confirm",
        deletedToast: "User archived.",
        unlockedToast: "Account unlocked.",
        neverActive: "Never",
        close: "Close",
      },
      home: {
        brand: "INVESTPRO",
        heroTitle: "Take full control of your money with ease",
        heroSubtitle: "Track spending, compare performance, and unlock premium insights.",
        cta: "Get Started For Free",
        previewLabel: "Dashboard preview",
        previewTitle: "Immersive finance control",
        connected: "Connected",
        balance: "Balance",
        availableFunds: "Available funds",
        income: "Income",
        last30Days: "Last 30 days",
        signal: "Signal",
        portfolioMomentum: "Portfolio momentum",
        insights: "Insights",
        healthForecast: "Portfolio health & forecast",
        premium: "Premium",
        spendRate: "Spend rate",
        riskLevel: "Risk level",
        low: "Low",
        aiInsights: "AI insights",
        automatedGuidance: "Automated portfolio guidance",
        automatedGuidanceDesc: "Intelligent recommendations help you move faster.",
        secure: "Secure",
        enterpriseProtection: "Enterprise-grade protection",
        enterpriseProtectionDesc: "Multi-layer encryption and access controls.",
        design: "Design",
        immersiveUi: "Minimal, immersive UI",
        immersiveUiDesc: "Clean layouts and subtle motion for premium experiences.",
        deepInsights: "Deep insights",
        precisionHeadline: "Built for investors who want precision",
        precisionSubheadline: "Powerful analytics and elegant controls to act with confidence.",
        precisionTracking: "Precision tracking",
        precisionTrackingDesc: "Monitor every position with crisp metrics.",
        adaptiveAlerts: "Adaptive alerts",
        adaptiveAlertsDesc: "Stay ahead with real-time signals.",
        glowingPerformance: "Glowing performance",
        glowingPerformanceDesc: "Visualize growth with clean charts and soft glow accents.",
        nextLevelControl: "Next-level control",
        longerPageTitle: "A longer page to explore premium capabilities",
        longerPageDesc: "Discover advanced fintech tools and a polished interface.",
        monthlyVolume: "Monthly volume",
        conversion: "Conversion",
        retention: "Retention",
      },
      login: {
        title: "Anmelden",
        subtitle: "Greifen Sie auf Ihr Anlageportfolio zu",
        createAccount: "Konto erstellen",
        emailOrPasswordInvalid: "E-Mail oder Passwort falsch",
        emailLabel: "E-Mail",
        passwordLabel: "Passwort",
        showPasswordAria: "Passwort anzeigen",
        hidePasswordAria: "Passwort ausblenden",
        rememberMe: "Angemeldet bleiben",
        forgotPassword: "Passwort vergessen?",
        signIn: "Anmelden",
        noAccount: "Noch kein Konto?",
        demoPrefix: "Serverkonto:",
        demoBody:
          "Nur registrierte Nutzer dieser API (Registrierung + E-Mail-Code). In der Entwicklung legt das Backend an: investor.demo@example.com / Invest#demo1, admin@example.com / Admin#demo1 und pro.demo@example.com / Pro#demo1 (Pro-Investor).",
        realtimeTitle: "Echtzeitdaten",
        realtimeDesc: "Verfolgen Sie Live-Preise und Marktbewegungen.",
        securityTitle: "Maximale Sicherheit",
        securityDesc: "Ihre Daten sind mit moderner Verschlusselung geschutzt.",
      },
      register: {
        title: "Konto erstellen",
        subtitle: "Geben Sie Ihre Daten ein, um fortzufahren",
        success: "Konto erfolgreich erstellt. Sie konnen sich jetzt anmelden.",
        passwordInvalid: "Das Passwort erfullt nicht alle Anforderungen.",
        under18: "Registrierung abgelehnt: Sie mussen mindestens 18 Jahre alt sein.",
        familyName: "Nachname",
        name: "Vorname",
        dateOfBirth: "Geburtsdatum",
        email: "E-Mail",
        password: "Passwort",
        createMyAccount: "Mein Konto erstellen",
        alreadyHaveAccount: "Sie haben bereits ein Konto?",
        performanceTitle: "Performance-Tracking",
        performanceDesc: "Analysieren Sie Ihre Investments mit klaren Kennzahlen.",
        protectionTitle: "Kontoschutz",
        protectionDesc: "Nutzen Sie ein starkes Passwort fur Ihre Sicherheit.",
        passwordRuleLetter: "Mindestens ein Buchstabe",
        passwordRuleNumber: "Mindestens eine Zahl",
        passwordRuleSymbol: "Mindestens ein Symbol",
        passwordRuleLength: "Mindestens 8 Zeichen",
        showPasswordCheckboxLabel: "Passwort anzeigen",
      },
      forgotPassword: {
        title: "Passwort vergessen",
        subtitle: "Wir senden einen 6-stelligen Code an Ihre E-Mail.",
        emailLabel: "E-Mail",
        sendCode: "Code senden",
        successHint: "Falls ein Konto existiert, finden Sie den Code in Ihrem Postfach.",
        backToLogin: "Zuruck zur Anmeldung",
        continueToReset: "Neues Passwort festlegen",
      },
      resetPassword: {
        title: "Neues Passwort",
        subtitle: "Geben Sie den Code aus der E-Mail und ein neues Passwort ein.",
        codeLabel: "6-stelliger Code",
        newPasswordLabel: "Neues Passwort",
        resetButton: "Passwort zurucksetzen",
        successToast: "Passwort aktualisiert. Sie konnen sich jetzt anmelden.",
        backToLogin: "Zuruck zur Anmeldung",
        invalidCode: "Ungultiger oder abgelaufener Code. Fordern Sie einen neuen an.",
        missingEmail: "Bitte zuerst Passwort vergessen und Ihre E-Mail eingeben.",
      },
      upgrade: {
        heroBadge: "Premium-Upgrade",
        heroTitle: "Stärken Sie Ihr Portfolio mit Pro",
        heroSubtitle: "Schalten Sie erweiterte Analysen und ein besseres Trading-Erlebnis frei.",
        whatYouGet: "Das erhalten Sie",
        whatYouGetPoints: ["Erweiterte Performance-Analysen", "Priorisierter Support", "Sichere Zahlungsabwicklung"],
        stepLabels: {
          step: "Schritt {step} von 4",
          planSelection: "Planauswahl",
          paymentMethod: "Zahlungsmethode",
          details: "Details",
          review: "Überprüfung",
        },
        planNames: { monthly: "Monatsplan", yearly: "Jahresplan" },
        planPrices: { monthly: "20 TND / Monat", yearly: "200 TND / Jahr" },
        planHighlights: { yearly: "Spare 40 TND" },
        planDetails: {
          flexibleMonthlyBilling: "Flexible monatliche Abrechnung",
          cancelAnytime: "Jederzeit kündbar",
          bestValue: "Bestes Preis-Leistungs-Verhältnis",
          twoMonthsFree: "2 Monate gratis",
        },
        trialLabel: "7-tägige kostenlose Testversion",
        selectedLabel: "Ausgewählt",
        paymentMethods: { card: "Kartenzahlung", d17: "D17 (Mobile Zahlung)" },
        paymentMethodDescriptions: { card: "Visa, Mastercard oder lokale Karte", d17: "Tunesische mobile Zahlung via D17" },
        cardNumber: "Kartennummer",
        expiryDate: "Ablaufdatum",
        cvv: "CVV",
        nameOnCard: "Name auf der Karte",
        phoneNumber: "Telefonnummer",
        phonePlaceholder: "+216 9xx xxx xxx",
        phoneHelp: "Ein sicherer Zahlungslink wird an Ihr Telefon gesendet.",
        selectedPlanLabel: "Ausgewählter Plan",
        billedMonthly: "Monatlich abgerechnet mit 20 TND",
        billedYearly: "Jährlich abgerechnet mit 200 TND",
        summaryTitle: "Zusammenfassung",
        summaryPaymentMethod: "Zahlungsmethode",
        summaryTrial: "7-tägige kostenlose Testversion inklusive",
        securePaymentTitle: "Sichere Zahlung",
        securePaymentCopy: "Ihre Daten werden mit branchenüblicher Verschlüsselung geschützt.",
        premiumBenefitsTitle: "Premium-Vorteile",
        premiumBenefitsPoints: ["Erweiterte Analysen", "Priorisierter Support", "Sicheres Onboarding"],
        back: "Zurück",
        continue: "Weiter",
        startFreeTrial: "Kostenlose Testphase starten",
        payViaD17: "Mit D17 bezahlen",
        confirmPayment: "Zahlung bestätigen",
        d17Checkout: {
          title: "D17-Zahlung",
          subtitle: "Schließen Sie die Zahlung in der D17-App auf Ihrem Telefon ab.",
          stepsTitle: "Schritte",
          step1: "Öffnen Sie die D17-App und melden Sie sich an.",
          step2: "Überweisen Sie den angezeigten Betrag an das InvestPro-Händlerkonto (Details per E-Mail oder Support).",
          step3: "Nutzen Sie Ihre E-Mail oder die untenstehende Nummer als Verwendungszweck.",
          amountLabel: "Fälliger Betrag",
          planLabel: "Plan",
          phoneLabel: "Eingegebene Telefonnummer",
          footerNote: "Die Freischaltung kann bis zu 24 Stunden dauern. Bei Fragen: Nachrichten/Support.",
          backToUpgrade: "Plan ändern",
          goDashboard: "Zum Dashboard",
          confirmPaidActivate: "Bezahlt — Pro aktivieren",
          invalidSession: "Zahlungssitzung fehlt. Bitte erneut über die Upgrade-Seite starten.",
          retryUpgrade: "Zurück zum Upgrade",
        },
        cardNumberPlaceholder: "1234 5678 9012 3456",
        expiryPlaceholder: "MM/JJ",
        cvvPlaceholder: "123",
        cardholderNamePlaceholder: "Name auf der Karte",
        cardTypes: { visa: "Visa", mastercard: "Mastercard", amex: "American Express", discover: "Discover", unknown: "Karte" },
        validation: {
          requiredField: "Dieses Feld ist erforderlich",
          invalidCardNumber: "Ungültige Kartennummer",
          invalidCardNumberLength: "Kartennummer muss 13 bis 19 Ziffern lang sein",
          invalidExpiryFormat: "Ungültiges Ablaufdatum",
          cardExpired: "Karte abgelaufen",
          invalidCvv: "Ungültiger CVV",
          invalidCardholderName: "Ungültiger Karteninhabername",
        },
      },
      messages: {
        title: "Nachrichten",
        subtitle: "Schreiben Sie das InvestPro-Team",
        contactAdmin: "Admin kontaktieren",
        modalTitle: "Neue Unterhaltung",
        subjectOptional: "Betreff (optional)",
        subjectPlaceholder: "Worum geht es?",
        messageLabel: "Nachricht",
        messagePlaceholder: "Beschreiben Sie Ihr Anliegen…",
        send: "Senden",
        cancel: "Abbrechen",
        noConversations: "Noch keine Unterhaltungen.",
        selectConversation: "Wählen Sie eine Unterhaltung aus der Liste.",
        closedHint: "Diese Unterhaltung ist geschlossen.",
        placeholderReply: "Nachricht schreiben…",
        loadingList: "Wird geladen…",
        loadingThread: "Nachrichten werden geladen…",
        unread: "Ungelesen",
        adminLabel: "InvestPro Support",
        youLabel: "Sie",
        verifyRequired: "Bitte bestätigen Sie Ihre E-Mail, um Nachrichten zu nutzen.",
        adminTitle: "Nutzer-Nachrichten",
        adminSubtitle: "Investoren-Unterhaltungen und Admin-Antworten",
        colUser: "Nutzer",
        colRole: "Rolle",
        colLastMessage: "Letzte Nachricht",
        colStatus: "Status",
        colUnread: "Ungelesen",
        filterStatus: "Status",
        filterRole: "Rolle",
        filterAll: "Alle",
        closeConversation: "Schließen",
        reopenConversation: "Wieder öffnen",
        statusOpen: "Offen",
        statusClosed: "Geschlossen",
        roleInvestor: "Investor",
        rolePro: "Pro",
        backToList: "Zurück zur Liste",
        sentToast: "Nachricht gesendet",
        sendError: "Senden fehlgeschlagen",
        createdToast: "Unterhaltung erstellt",
      },
      aiAssistant: {
        title: "KI-Assistent",
        subtitle: "Fragen zu Aktien mit Plattformdaten.",
        placeholder: "Frage zu einer Aktie stellen…",
        attachStock: "Aktie anhängen",
        send: "Senden",
        newChat: "Neue Unterhaltung",
        historyTitle: "Verlauf",
        noConversations: "Keine gespeicherten Unterhaltungen.",
        emptyThreadHint: "Stellen Sie eine Frage oder hängen Sie ein Symbol an.",
        lockedTitle: "KI-Assistent nur für Pro",
        lockedSubtitle: "Upgrade auf Pro für Live- und Historiendaten.",
        upgradeCta: "Pro werden",
        retry: "Erneut",
        sendError: "Antwort nicht möglich.",
        stockPickerTitle: "Aktie wählen",
        stockSearch: "Symbol oder Name suchen…",
        pick: "Auswählen",
        attachedPrefix: "Kontext",
        clearStock: "Entfernen",
        typing: "KI denkt nach",
        deleteConversation: "Löschen",
        deleteConversationAria: "Diese Unterhaltung löschen",
        deleteConversationConfirm: "Diese Unterhaltung löschen? Das kann nicht rückgängig gemacht werden.",
        deleteConversationError: "Unterhaltung konnte nicht gelöscht werden.",
      },
      proFeature: {
        modalTitle: "Pro-Funktion",
        modalSubtitle: "Upgrade auf Pro für KI-Trading und den erweiterten Simulator.",
        upgradeCta: "Pro werden",
        badgePro: "Pro",
        previewFeatures: [
          "KI-Trading-Bots mit Regeln und Tageslimits",
          "Portfolio-Simulator mit erwarteter Rendite",
          "Sicherer Echtzeit-Feed (Socket.io)",
        ],
        lockHint: "Nur für Pro-Investor-Konten.",
      },
    },
  },
  ar: {
    languageName: "Arabic",
    nav: {
      dashboard: "لوحة التحكم",
      portfolio: "المحفظة",
      markets: "الاسواق",
      aiAsset: "اصل بالذكاء",
      aiSimulator: "محاكي",
      aiTrading: "تداول بالذكاء",
      aiAssistant: "مساعد الذكاء",
      transactions: "المعاملات",
      settings: "الاعدادات",
      adminAssets: "الادارة - الاصول",
      adminUsers: "User management",
      adminMessages: "رسائل المستخدمين",
      messages: "الرسائل",
      withdraw: enLocale.nav.withdraw,
    },
    header: {
      searchPlaceholder: "ابحث عن اصل... (⌘K)",
      searchNoResults: "لم يتم العثور على اسهم",
      logout: "تسجيل الخروج",
      admin: "مسؤول",
      investor: "مستثمر",
      stndChipLabel: enLocale.header.stndChipLabel,
      stndUnit: enLocale.header.stndUnit,
    },
    sidebar: { proVersion: "نسخة برو", advancedInsights: "الوصول الى تحليلات متقدمة", upgrade: "الترقية الى برو" },
    pages: {
      dashboard: {
        title: "لوحة التحكم",
        subtitle: "نظرة عامة على محفظتك الاستثمارية",
        statLabels: {
          totalValue: "القيمة الإجمالية",
          profitLoss: "الربح/الخسارة",
          assetsCount: "عدد الأصول",
          performance: "الأداء",
        },
        statChanges: {
          thisMonth: "هذا الشهر",
          assetsDifferent: "أصول مختلفة",
          over7Months: "على مدى 7 أشهر",
        },
        totalValueBreakdownAssets: "الأصول",
        totalValueBreakdownCash: "السيولة",
        totalValueInfoAria: "التفصيل: أصول السوق ورصيد النقد",
        chart: {
          portfolioTitle: "أداء المحفظة",
          portfolioSubtitle: "التطور خلال آخر 7 أشهر",
          distributionTitle: "التوزيع",
          distributionSubtitle: "حسب نوع الأصل",
          tooltipValueLabel: "القيمة",
          donutTotalLabel: "قيمة الأصول",
          distributionTooltipInvestedShare: "من المحفظة المستثمرة",
        },
        performanceMonths: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو"],
        assetTypes: {
          stock: "أسهم",
          crypto: "عملات رقمية",
          etf: "ETF",
        },
        table: {
          topPerformances: "أفضل الأداء",
          asset: "الأصل",
          quantity: "الكمية",
          purchasePrice: "سعر الشراء",
          currentPrice: "السعر الحالي",
          gainLoss: "الربح/الخسارة",
        },
      },
      portfolio: {
        title: "محفظتي",
        subtitle: "ادارة الاصول ومتابعة الاداء",
        buyAsset: "شراء اصل",
        loadAccount: "تحميل الحساب",
        sell: "بيع",
        noTransactions: "لا توجد معاملات",
        insufficientStnd: enLocale.pages.portfolio.insufficientStnd,
        withdraw: enLocale.pages.portfolio.withdraw,
      },
      loadAccount: {
        title: "تحميل الحساب",
        subtitle: "اضف اموالا الى رصيدك",
        amountLabel: "المبلغ (TND)",
        quickSelect: "اختيار سريع",
        paymentMethod: "طريقة الدفع",
        enterAmount: "ادخل مبلغا ايجابيا",
        confirmPayment: "تأكيد الدفع",
        successMessage: "تمت اضافة الأموال بنجاح",
        trial: "تجربة مجانية لمدة 7 أيام",
        ...enLocale.pages.loadAccount,
      },
      withdraw: enLocale.pages.withdraw,
      wallet: enLocale.pages.wallet,
      markets: {
        title: "الاسواق",
        subtitle: "متابعة اداء السوق في الوقت الحقيقي",
        searchPlaceholder: "ابحث عن اصل...",
        all: "الكل",
        stocks: "اسهم",
        crypto: "عملات رقمية",
        favorites: "المفضلات",
        clearFilters: "مسح المرشحات",
        noMatchFilters: "لا توجد اسهم مطابقة لمرشحاتك",
      },
      aiAsset: {
        title: "شرح الاصل بالذكاء",
        subtitle: "شرح مبسط قبل التعمق",
        searchPlaceholder: "الاسم او الرمز (مثل BIAT، BTC)...",
        explain: "عرض الشرح",
        cardWhat: "باختصار",
        cardRisk: "المخاطر (ببساطة)",
        cardWhy: "لماذا يستثمر البعض",
        disclaimer: "تذكير: تعليمي وليس استشارا شخصية.",
        loading: "جاري توليد الشرح...",
        loadingAssets: "جاري تحميل الاصول...",
        pickAsset: "اختر اصلا من القائمة او ابحث بالرمز.",
        error: "تعذر التحميل. تحقق من الخادم ثم حاول مجددا.",
      },
      aiTradingPage: {
        moduleLabel: "تداول بالذكاء",
        title: "تداول بالذكاء",
        subtitle: "ادِر روبوتات التداول التلقائي وراقب النشاط في الوقت الحقيقي.",
        newBot: "بوت جديد",
        verificationRequired: "تحقق من بريدك الإلكتروني للوصول إلى التداول.",
        activeBotsHeading: "البوتات النشطة",
        loading: "جاري التحميل...",
        emptyBots: "لا توجد بوتات.",
        pnlTitle: "صافي الربح/الخسارة",
        pnlSubtitle: "الأرباح والخسائر المتراكمة من بوتاتك",
        socketStream: "تدفق العمليات المباشر",
        controlPanelTitle: "لوحة التحكم",
        selectedBot: "البوت المحدد:",
        modeManual: "يدوي",
        modeAiStrategy: "استراتيجية ذكاء اصطناعي",
        transactionsPerDay: "عملية/يوم",
        start: "تشغيل",
        pause: "إيقاف مؤقت",
        stopHard: "إيقاف فوري",
        realizedLossToday: "الخسارة المحققة اليوم:",
        operationsFeedTitle: "تدفق العمليات",
        marketBannerUnavailable: "السجل غير متاح لهذا البوت.",
        feedLoading: "جاري تحميل التدفق...",
        feedEmpty: "لا توجد عمليات مسجلة.",
        tableHeaderAsset: "الأصل",
        tableHeaderAction: "الإجراء",
        tableHeaderAmount: "المبلغ",
        tableHeaderResult: "النتيجة",
        tableHeaderTime: "الوقت",
        actionBuy: "شراء",
        actionSell: "بيع",
        statusSuccess: "نجاح",
        statusPending: "قيد الانتظار",
        statusFailed: "فشل",
        loadBotsError: "تعذر تحميل البوتات.",
        loadFeedError: "تعذر تحميل سجل البوت.",
        dailyLossLimitReached: "تم الوصول إلى حد الخسارة اليومي: تم إيقاف البوت.",
        botStartedToast: "تم تشغيل البوت.",
        botPausedToast: "تم إيقاف البوت مؤقتًا.",
        botStoppedToast: "تم إيقاف البوت.",
        actionFailed: "فشل الإجراء.",
      },
      aiTradingWizard: {
        title: "مساعد انشاء - بوت تداول بالذكاء الاصطناعي",
        description: "انشاء بوت موجه مع ضوابط للمخاطر وشروط شراء/بيع.",
        botNameLabel: "اسم البوت",
        botNamePlaceholder: "مثال: استراتيجية BVMT الحذرة",
        modeLabel: "الوضع",
        manualStrategy: "استراتيجية يدوية",
        manualStrategyHint: "قواعد صريحة (% العتبة، السعر...)",
        aiStrategy: "استراتيجية ذكاء اصطناعي",
        aiStrategyHint: "درجة مرجحة (الاتجاه، التقلب...)",
        maxAllocationLabel: "الحد الاقصى لكل صفقة (TND)",
        maxTransactionsLabel: "الحد الاقصى للمعاملات يوميا",
        riskLevelLabel: "مستوى المخاطر",
        riskLow: "منخفض",
        riskMedium: "متوسط",
        riskHigh: "مرتفع",
        assetSymbolLabel: "الاصل (الرمز)",
        assetPlaceholder: "— اختر اصلا —",
        assetEmptyLabel: "لا توجد اصول مطابقة للفلاتر الحالية. عدل الفلاتر في صفحة الاسواق.",
        assetRequiredHint: "الرجاء اختيار اصل للمتابعة.",
        buyConditionLabel: "شرط شراء",
        buyConditionPercentage: "% هبوط",
        buyConditionPrice: "السعر الاقصى",
        buyConditionAiSignal: "اشارة ذكاء اصطناعي",
        buyThresholdLabel: "عتبة الشراء (% او سعر TND حسب الوضع)",
        reinforceWithAiSignal: "تعزيز باستخدام اشارة الذكاء الاصطناعي (الوضع اليدوي)",
        takeProfitLabel: "جني الربح (%)",
        stopLossLabel: "وقف الخسارة (%)",
        useAiExitLabel: "خروج بمساعدة الذكاء الاصطناعي",
        riskWarningTitle: "تحذير المخاطر",
        riskWarningBody:
          "التداول الآلي يحمل مخاطر خسارة رأس المال. الأداء السابق لا يضمن النتائج المستقبلية. تعتمد المحرك على بيانات السوق التي قد تكون غير متاحة أو متأخرة.",
        riskScoreTitle: "درجة المخاطر المقدرة (استرشادية)",
        riskScoreSubtitle: "بناءً على الحد الأقصى لكل صفقة، مستوى المخاطر، وحد التكرار.",
        summaryNameLabel: "الاسم:",
        summaryModeLabel: "الوضع:",
        summaryMaxTradeLabel: "الحد الأقصى / صفقة:",
        summaryAssetLabel: "الاصل:",
        confirmRiskLabel:
          "أؤكد أنني قرأت التحذير وأقبل أن بدء البوت هو مسؤوليتي.",
        back: "رجوع",
        next: "التالي",
        createBot: "انشاء البوت",
        creating: "جار الانشاء...",
        errorChooseAsset: "اختر اصلا للمتابعة.",
        errorChooseAssetSymbol: "اختر رمز الاصول.",
        errorConfirmRisk: "يجب التأكيد بأنك تفهم المخاطر.",
        successCreated: "تم انشاء البوت. يمكنك تشغيله من لوحة التحكم.",
        errorCreationFailed: "فشل الانشاء",
      },
      simulator: {
        title: "محاكي الاستثمار",
        subtitle: "توقعات للدفعات الشهرية: يُقدَّر العائد السنوي من محفظتك وبيانات السوق (Yahoo Finance).",
        monthlyLabel: "استثمار شهري (TND)",
        yearsLabel: "أفق المحاكاة (سنوات)",
        portfolioBasisLabel: "بناءً على محفظتك الحالية والأداء التاريخي للسوق",
        disclaimerPastPerformance: "الأداء السابق لا يضمن النتائج المستقبلية.",
        loadingExpectedReturn: "جاري حساب العائد المتوقع من محفظتك...",
        portfolioUnavailable:
          "تعذر تقدير العائد (محفظة فارغة أو بيانات غير متاحة). أضف مراكز أو فعّل العائد اليدوي.",
        breakdownHeading: "التفصيل حسب الأصل",
        breakdownWeight: "الوزن",
        breakdownReturn: "العائد السنوي المقدَّر",
        estimatedAnnualReturn: "العائد السنوي المقدَّر للمحفظة",
        customReturnToggle: "استخدام عائد مخصص (يدوي)",
        customReturnLabel: "عائد سنوي مخصص (%)",
        run: "احسب واشرح",
        loading: "جاري الحساب...",
        emptyHint: "املأ الحقول ثم شغّل المحاكاة.",
        invalidNumbers: "قيم غير صالحة.",
        finalValue: "الرصيد النهائي المتوقع",
        contributed: "إجمالي المدفوعات",
        gain: "النمو فوق المدفوعات",
        chartTitle: "المسار المتوقع",
        chartProjected: "الرصيد المتوقع",
        chartContributed: "المدفوعات التراكمية",
        year0: "البداية",
        yearPrefix: "سنة",
        aiTitle: "الشرح",
        error: "تعذر الاتصال بالواجهة. شغّل الخادم (npm run dev:all).",
        footerNote:
          "افتراض: نفس المبلغ نهاية كل شهر، سعر اسمي سنوي، تركيب شهري. التوقعات ليست ضماناً للمستقبل.",
      },
      transactions: { title: "المعاملات", subtitle: "السجل الكامل لمعاملاتك", totalBuy: "اجمالي الشراء", totalSell: "اجمالي البيع", totalTransactions: "اجمالي المعاملات", fromStart: "منذ البداية" },
      settings: { title: "الاعدادات", subtitle: "ادارة التفضيلات والامان", preferences: "التفضيلات", language: "اللغة", currency: "العملة", timezone: "المنطقة الزمنية" },
      admin: { title: "ادارة الاصول", subtitle: "اضف اصولا (مع واجهة API للسعر) واحذف الاصول غير المطلوبة." },
      adminDashboard: {
        subtitle: "لوحة الادارة: المستخدمون والاصوال والرسائل.",
      },
      adminUsersPage: {
        title: "User management",
        subtitle: "Accounts, login risk and automatic lockouts.",
        loadError: "Could not load users.",
        empty: "No users.",
        colName: "Name",
        colEmail: "Email",
        colLastActive: "Last active",
        colStatus: "Status",
        colRisk: "Risk",
        colActions: "Actions",
        statusActive: "Active",
        statusLocked: "Locked",
        riskBadgeLow: "Low",
        riskBadgeMid: "Watch",
        riskBadgeHigh: "Critical",
        view: "View",
        delete: "Delete",
        unlock: "Unlock",
        prev: "Previous",
        next: "Next",
        pageLabel: "Page",
        detailTitle: "User profile",
        roleInvestor: "Investor",
        rolePro: "Pro",
        failedAttempts: "Failed password attempts",
        lockReason: "Lock reason",
        confirmDeleteTitle: "Confirm deletion",
        confirmDeleteBody: "Archive this user? The account will be soft-deleted.",
        cancel: "Cancel",
        confirm: "Confirm",
        deletedToast: "User archived.",
        unlockedToast: "Account unlocked.",
        neverActive: "Never",
        close: "Close",
      },
      home: {
        brand: "INVESTPRO",
        heroTitle: "Take full control of your money with ease",
        heroSubtitle: "Track spending, compare performance, and unlock premium insights.",
        cta: "Get Started For Free",
        previewLabel: "Dashboard preview",
        previewTitle: "Immersive finance control",
        connected: "Connected",
        balance: "Balance",
        availableFunds: "Available funds",
        income: "Income",
        last30Days: "Last 30 days",
        signal: "Signal",
        portfolioMomentum: "Portfolio momentum",
        insights: "Insights",
        healthForecast: "Portfolio health & forecast",
        premium: "Premium",
        spendRate: "Spend rate",
        riskLevel: "Risk level",
        low: "Low",
        aiInsights: "AI insights",
        automatedGuidance: "Automated portfolio guidance",
        automatedGuidanceDesc: "Intelligent recommendations help you move faster.",
        secure: "Secure",
        enterpriseProtection: "Enterprise-grade protection",
        enterpriseProtectionDesc: "Multi-layer encryption and access controls.",
        design: "Design",
        immersiveUi: "Minimal, immersive UI",
        immersiveUiDesc: "Clean layouts and subtle motion for premium experiences.",
        deepInsights: "Deep insights",
        precisionHeadline: "Built for investors who want precision",
        precisionSubheadline: "Powerful analytics and elegant controls to act with confidence.",
        precisionTracking: "Precision tracking",
        precisionTrackingDesc: "Monitor every position with crisp metrics.",
        adaptiveAlerts: "Adaptive alerts",
        adaptiveAlertsDesc: "Stay ahead with real-time signals.",
        glowingPerformance: "Glowing performance",
        glowingPerformanceDesc: "Visualize growth with clean charts and soft glow accents.",
        nextLevelControl: "Next-level control",
        longerPageTitle: "A longer page to explore premium capabilities",
        longerPageDesc: "Discover advanced fintech tools and a polished interface.",
        monthlyVolume: "Monthly volume",
        conversion: "Conversion",
        retention: "Retention",
      },
      login: {
        title: "تسجيل الدخول",
        subtitle: "الوصول الى محفظتك الاستثمارية",
        createAccount: "انشاء حساب",
        emailOrPasswordInvalid: "البريد او كلمة المرور غير صحيحة",
        emailLabel: "البريد الالكتروني",
        passwordLabel: "كلمة المرور",
        showPasswordAria: "إظهار كلمة المرور",
        hidePasswordAria: "إخفاء كلمة المرور",
        rememberMe: "تذكرني",
        forgotPassword: "هل نسيت كلمة المرور؟",
        signIn: "تسجيل الدخول",
        noAccount: "ليس لديك حساب؟",
        demoPrefix: "حساب الخادم:",
        demoBody:
          "تسجيل الدخول فقط بحساب مسجل على هذه الواجهة (إنشاء حساب ثم رمز البريد). في التطوير ينشئ الخادم: investor.demo@example.com / Invest#demo1 و admin@example.com / Admin#demo1 و pro.demo@example.com / Pro#demo1 (استثمار Pro).",
        realtimeTitle: "بيانات فورية",
        realtimeDesc: "تابع الاسعار المباشرة وحركة السوق.",
        securityTitle: "حماية قصوى",
        securityDesc: "بياناتك محمية باحدث تقنيات التشفير.",
      },
      register: {
        title: "انشاء حساب",
        subtitle: "ادخل معلوماتك للمتابعة",
        success: "تم انشاء الحساب بنجاح. يمكنك تسجيل الدخول الان.",
        passwordInvalid: "كلمة المرور لا تحقق كل المتطلبات.",
        under18: "تم رفض التسجيل: يجب ان يكون العمر 18 سنة على الاقل.",
        familyName: "اللقب",
        name: "الاسم",
        dateOfBirth: "تاريخ الميلاد",
        email: "البريد الالكتروني",
        password: "كلمة المرور",
        createMyAccount: "انشاء حسابي",
        alreadyHaveAccount: "لديك حساب بالفعل؟",
        performanceTitle: "تتبع الاداء",
        performanceDesc: "حلل استثماراتك بمؤشرات واضحة.",
        protectionTitle: "حماية الحساب",
        protectionDesc: "استخدم كلمة مرور قوية لحماية بياناتك.",
        passwordRuleLetter: "حرف واحد على الاقل",
        passwordRuleNumber: "رقم واحد على الاقل",
        passwordRuleSymbol: "رمز واحد على الاقل",
        passwordRuleLength: "8 احرف على الاقل",
        showPasswordCheckboxLabel: "إظهار كلمة المرور",
      },
      forgotPassword: {
        title: "نسيت كلمة المرور",
        subtitle: "سنرسل رمزًا مكونًا من 6 أرقام إلى بريدك.",
        emailLabel: "البريد الالكتروني",
        sendCode: "إرسال الرمز",
        successHint: "إن وُجد حساب، تحقق من بريدك للحصول على رمز إعادة التعيين.",
        backToLogin: "العودة لتسجيل الدخول",
        continueToReset: "تعيين كلمة مرور جديدة",
      },
      resetPassword: {
        title: "كلمة مرور جديدة",
        subtitle: "أدخل الرمز من البريد واختر كلمة مرور جديدة.",
        codeLabel: "الرمز المكون من 6 أرقام",
        newPasswordLabel: "كلمة المرور الجديدة",
        resetButton: "إعادة تعيين كلمة المرور",
        successToast: "تم تحديث كلمة المرور. يمكنك تسجيل الدخول الآن.",
        backToLogin: "العودة لتسجيل الدخول",
        invalidCode: "رمز غير صالح أو منتهٍ. اطلب رمزًا جديدًا.",
        missingEmail: "ابدأ من صفحة نسيت كلمة المرور وأدخل بريدك أولاً.",
      },
      upgrade: {
        heroBadge: "ترقية بريميوم",
        heroTitle: "عزز محفظتك مع Pro",
        heroSubtitle: "افتح التحليلات المتقدمة وتجربة تداول محسنة.",
        whatYouGet: "ما ستحصل عليه",
        whatYouGetPoints: ["تحليلات أداء متقدمة", "دعم أولوية", "تدفق دفع آمن"],
        stepLabels: {
          step: "الخطوة {step} من 4",
          planSelection: "اختيار الخطة",
          paymentMethod: "طريقة الدفع",
          details: "تفاصيل",
          review: "مراجعة",
        },
        planNames: { monthly: "الخطة الشهرية", yearly: "الخطة السنوية" },
        planPrices: { monthly: "20 TND / شهر", yearly: "200 TND / سنة" },
        planHighlights: { yearly: "وفر 40 TND" },
        planDetails: {
          flexibleMonthlyBilling: "فوترة شهرية مرنة",
          cancelAnytime: "إلغاء في أي وقت",
          bestValue: "أفضل قيمة للأعضاء السنويين",
          twoMonthsFree: "شهران مجانًا",
        },
        trialLabel: "تجربة مجانية لمدة 7 أيام",
        selectedLabel: "محدد",
        paymentMethods: { card: "الدفع بالبطاقة", d17: "الدفع عبر D17" },
        paymentMethodDescriptions: { card: "Visa أو Mastercard أو بطاقة محلية", d17: "الدفع عبر الهاتف المتنقل التونسي D17" },
        cardNumber: "رقم البطاقة",
        expiryDate: "تاريخ انتهاء الصلاحية",
        cvv: "CVV",
        nameOnCard: "الاسم على البطاقة",
        phoneNumber: "رقم الهاتف",
        phonePlaceholder: "+216 9xx xxx xxx",
        phoneHelp: "سيتم إرسال رابط دفع آمن إلى هاتفك.",
        selectedPlanLabel: "الخطة المحددة",
        billedMonthly: "يتم الفوترة شهريًا مقابل 20 TND",
        billedYearly: "يتم الفوترة سنويًا مقابل 200 TND",
        summaryTitle: "ملخص",
        summaryPaymentMethod: "طريقة الدفع",
        summaryTrial: "تجربة مجانية لمدة 7 أيام متضمنة",
        securePaymentTitle: "دفع آمن",
        securePaymentCopy: "يتم حماية معلوماتك باستخدام تشفير قياسي للصناعة.",
        premiumBenefitsTitle: "مزايا بريميوم",
        premiumBenefitsPoints: ["تحليلات متقدمة", "دعم أولوية", "تفعيل آمن"],
        back: "رجوع",
        continue: "متابعة",
        startFreeTrial: "ابدأ التجربة المجانية",
        payViaD17: "الدفع عبر D17",
        confirmPayment: "تأكيد الدفع",
        d17Checkout: {
          title: "دفع D17",
          subtitle: "أكمل الدفع في تطبيق D17 على هاتفك.",
          stepsTitle: "الخطوات",
          step1: "افتح تطبيق D17 وسجّل الدخول.",
          step2: "أرسل المبلغ المعروض إلى حساب InvestPro التجاري (تفاصيل عبر البريد أو الدعم).",
          step3: "استخدم بريدك أو رقم الهاتف أدناه كمرجع لربط الدفع بحسابك.",
          amountLabel: "المبلغ المستحق",
          planLabel: "الخطة",
          phoneLabel: "الهاتف المُدخل",
          footerNote: "قد يستغرق التفعيل حتى 24 ساعة. راسل الدعم من الرسائل عند الحاجة.",
          backToUpgrade: "تغيير الخطة",
          goDashboard: "العودة إلى لوحة التحكم",
          confirmPaidActivate: "تم الدفع — تفعيل Pro",
          invalidSession: "جلسة الدفع غير مكتملة. ابدأ من جديد من صفحة الترقية.",
          retryUpgrade: "العودة إلى الترقية",
        },
        cardNumberPlaceholder: "1234 5678 9012 3456",
        expiryPlaceholder: "MM/YY",
        cvvPlaceholder: "123",
        cardholderNamePlaceholder: "اسم حامل البطاقة",
        cardTypes: { visa: "Visa", mastercard: "Mastercard", amex: "American Express", discover: "Discover", unknown: "بطاقة" },
        validation: {
          requiredField: "هذا الحقل مطلوب",
          invalidCardNumber: "رقم البطاقة غير صالح",
          invalidCardNumberLength: "يجب أن يحتوي رقم البطاقة على 13 إلى 19 رقمًا",
          invalidExpiryFormat: "تاريخ انتهاء صلاحية غير صالح",
          cardExpired: "البطاقة منتهية الصلاحية",
          invalidCvv: "CVV غير صالح",
          invalidCardholderName: "اسم حامل البطاقة غير صالح",
        },
      },
      messages: {
        title: "الرسائل",
        subtitle: "تواصل مع فريق InvestPro",
        contactAdmin: "مراسلة المسؤول",
        modalTitle: "محادثة جديدة",
        subjectOptional: "الموضوع (اختياري)",
        subjectPlaceholder: "موضوع الطلب",
        messageLabel: "الرسالة",
        messagePlaceholder: "صف طلبك…",
        send: "ارسال",
        cancel: "الغاء",
        noConversations: "لا توجد محادثات بعد.",
        selectConversation: "اختر محادثة من القائمة.",
        closedHint: "هذه المحادثة مغلقة.",
        placeholderReply: "اكتب رسالتك…",
        loadingList: "جاري التحميل…",
        loadingThread: "جاري تحميل الرسائل…",
        unread: "غير مقروء",
        adminLabel: "دعم InvestPro",
        youLabel: "انت",
        verifyRequired: "فعّل بريدك الالكتروني لاستخدام المراسلة.",
        adminTitle: "رسائل المستخدمين",
        adminSubtitle: "محادثات المستثمرين وردود المسؤول",
        colUser: "المستخدم",
        colRole: "الدور",
        colLastMessage: "آخر رسالة",
        colStatus: "الحالة",
        colUnread: "غير مقروء",
        filterStatus: "الحالة",
        filterRole: "الدور",
        filterAll: "الكل",
        closeConversation: "اغلاق",
        reopenConversation: "اعادة فتح",
        statusOpen: "مفتوحة",
        statusClosed: "مغلقة",
        roleInvestor: "مستثمر",
        rolePro: "برو",
        backToList: "العودة للقائمة",
        sentToast: "تم ارسال الرسالة",
        sendError: "تعذر الارسال",
        createdToast: "تم انشاء المحادثة",
      },
      aiAssistant: {
        title: "مساعد الذكاء",
        subtitle: "اسئلة عن الاسهم مع بيانات المنصة.",
        placeholder: "اسأل عن سهم…",
        attachStock: "ارفاق سهم",
        send: "ارسال",
        newChat: "محادثة جديدة",
        historyTitle: "السجل",
        noConversations: "لا محادثات محفوظة.",
        emptyThreadHint: "اكتب سؤالا او ارفق رمزا.",
        lockedTitle: "مساعد الذكاء لمستثمري Pro",
        lockedSubtitle: "ترقية الى Pro للاسئلة مع بيانات حية وتاريخية.",
        upgradeCta: "الترقية إلى Pro",
        retry: "اعادة المحاولة",
        sendError: "تعذر الحصول على رد.",
        stockPickerTitle: "اختيار سهم",
        stockSearch: "بحث عن الرمز او الاسم…",
        pick: "اختيار",
        attachedPrefix: "سياق",
        clearStock: "ازالة",
        typing: "جاري التفكير",
        deleteConversation: "حذف",
        deleteConversationAria: "حذف هذه المحادثة",
        deleteConversationConfirm: "حذف هذه المحادثة؟ لا يمكن التراجع.",
        deleteConversationError: "تعذر حذف المحادثة.",
      },
      proFeature: {
        modalTitle: "ميزة Pro",
        modalSubtitle: "ارتقِ إلى Pro لفتح التداول بالذكاء والمحاكي المتقدم.",
        upgradeCta: "الترقية إلى Pro",
        badgePro: "Pro",
        previewFeatures: [
          "روبوتات تداول بالذكاء مع قواعد وسقوف يومية",
          "محاكي الإسقاط مع العائد المتوقع للمحفظة",
          "بث فوري آمن (Socket.io)",
        ],
        lockHint: "مخصص لحسابات استثمار Pro.",
      },
    },
  },
};

type LanguageContextType = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  text: TranslationPack;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "app-language";
const USER_LANGUAGE_PREFIX = "user-language:";
/** Default UI language when no preference is stored (equivalent to i18next `lng` / `fallbackLng`). */
const DEFAULT_LANGUAGE: AppLanguage = "en";
const COUNTRY_LANGUAGE_MAP: Record<string, AppLanguage> = {
  TN: "fr",
  FR: "fr",
  MA: "fr",
  DZ: "fr",
  ES: "es",
  MX: "es",
  AR: "es",
  DE: "de",
  AT: "de",
  CH: "de",
  SA: "ar",
  AE: "ar",
  EG: "ar",
};

function normalizeLanguage(value?: string | null): AppLanguage | null {
  if (!value) return null;
  const shortCode = value.toLowerCase().split("-")[0] as AppLanguage;
  return translations[shortCode] ? shortCode : null;
}

async function detectLanguageFromIp(): Promise<AppLanguage | null> {
  try {
    const response = await fetch("https://ipapi.co/json/");
    if (!response.ok) return null;
    const payload = (await response.json()) as { country_code?: string };
    const countryCode = payload.country_code?.toUpperCase();
    if (!countryCode) return null;
    return COUNTRY_LANGUAGE_MAP[countryCode] ?? null;
  } catch {
    return null;
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(DEFAULT_LANGUAGE);

  useEffect(() => {
    const bootstrapLanguage = async () => {
      const fromStorage = normalizeLanguage(localStorage.getItem(STORAGE_KEY));
      if (fromStorage) {
        setLanguageState(fromStorage);
        return;
      }

      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser) as { email?: string };
          const fromUser = normalizeLanguage(user.email ? localStorage.getItem(`${USER_LANGUAGE_PREFIX}${user.email}`) : null);
          if (fromUser) {
            setLanguageState(fromUser);
            return;
          }
        } catch {
          // Ignore corrupted storage values.
        }
      }

      // No saved preference: keep DEFAULT_LANGUAGE (en). Do not infer from IP or browser —
      // stored keys above still override on return visits.
    };

    void bootstrapLanguage();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser) as { email?: string };
        if (user.email) {
          localStorage.setItem(`${USER_LANGUAGE_PREFIX}${user.email}`, language);
        }
      } catch {
        // Ignore corrupted user storage.
      }
    }
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const setLanguage = (nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      text: translations[language],
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
