import React, { createContext, useContext, useState, useEffect } from 'react';
import { SPRINT_7_DAYS, NICHES_DATA } from '../data/blueprintData';
import { calculateLandedCost } from '../utils/calculator';
import { LandedCostResult } from '../types/blueprint';
import { EscalationTicket } from '../types/chat';

export interface GlobalEcommerceState {
  // Exchange Rate
  exchangeRate: number;
  setExchangeRate: (rate: number) => void;

  // Selected Niche & Financial Product
  selectedNicheId: string;
  setSelectedNicheId: (id: string) => void;
  productName: string;
  setProductName: (name: string) => void;
  supplierCostUSD: number;
  setSupplierCostUSD: (cost: number) => void;
  shippingCostUSD: number;
  setShippingCostUSD: (cost: number) => void;
  salePriceCLP: number;
  setSalePriceCLP: (price: number) => void;
  gatewayType: 'webpay_debit' | 'webpay_credit' | 'mercadopago' | 'flow';
  setGatewayType: (g: 'webpay_debit' | 'webpay_credit' | 'mercadopago' | 'flow') => void;
  customAdCpa: number;
  setCustomAdCpa: (cpa: number) => void;
  returnRatePct: number;
  setReturnRatePct: (pct: number) => void;

  // Computed Financial Results
  financialResult: LandedCostResult;

  // Compliance State
  economicCode: string;
  setEconomicCode: (code: string) => void;
  taxRegime: 'pro_pyme_general' | 'pro_pyme_transparente';
  setTaxRegime: (regime: 'pro_pyme_general' | 'pro_pyme_transparente') => void;
  complianceChecked: { [itemKey: string]: boolean };
  toggleComplianceItem: (itemKey: string) => void;
  complianceScorePct: number;

  // Logistics State
  courierVolumeMonthly: number;
  setCourierVolumeMonthly: (vol: number) => void;
  selectedCourier: 'blue_express' | 'starken' | 'chilexpress' | 'chazki';
  setSelectedCourier: (courier: 'blue_express' | 'starken' | 'chilexpress' | 'chazki') => void;
  fulfillmentModel: 'in_house' | '3pl';
  setFulfillmentModel: (model: 'in_house' | '3pl') => void;
  boxLengthCm: number;
  setBoxLengthCm: (v: number) => void;
  boxWidthCm: number;
  setBoxWidthCm: (v: number) => void;
  boxHeightCm: number;
  setBoxHeightCm: (v: number) => void;
  boxWeightKg: number;
  setBoxWeightKg: (v: number) => void;

  // Sprint Tasks State
  completedTasks: { [taskId: string]: boolean };
  toggleTask: (taskId: string) => void;
  resetAllTasks: () => void;
  checkAllTasks: () => void;
  completedTasksCount: number;
  totalTasksCount: number;
  sprintProgressPct: number;

  // Support / Tickets
  escalatedTickets: EscalationTicket[];
  addEscalatedTicket: (ticket: EscalationTicket) => void;
  updateTicketStatus: (id: string, status: EscalationTicket['status']) => void;
  activeTicketsCount: number;

  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AppContext = createContext<GlobalEcommerceState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Exchange Rate
  const [exchangeRate, setExchangeRate] = useState<number>(940);

  // 2. Financial Simulation
  const [selectedNicheId, setSelectedNicheId] = useState<string>('mascotas');
  const defaultNiche = NICHES_DATA.find((n) => n.id === 'mascotas') || NICHES_DATA[0];
  const [productName, setProductName] = useState<string>(defaultNiche.entryProducts[0] || 'Dispensador inteligente para mascotas');
  const [supplierCostUSD, setSupplierCostUSD] = useState<number>(defaultNiche.supplierCostUSD);
  const [shippingCostUSD, setShippingCostUSD] = useState<number>(defaultNiche.shippingCostUSD);
  const [salePriceCLP, setSalePriceCLP] = useState<number>(defaultNiche.suggestedPvpCLP);
  const [gatewayType, setGatewayType] = useState<'webpay_debit' | 'webpay_credit' | 'mercadopago' | 'flow'>('webpay_credit');
  const [customAdCpa, setCustomAdCpa] = useState<number>(0);
  const [returnRatePct, setReturnRatePct] = useState<number>(3);

  // Computed Landed & Unit Economics
  const financialResult = calculateLandedCost(
    {
      supplierCostUSD,
      shippingCostUSD,
      salePriceCLP,
      gatewayType,
      adCpaCLP: customAdCpa > 0 ? customAdCpa : undefined,
      returnRatePct,
    },
    exchangeRate
  );

  // 3. Compliance & Tributario
  const [economicCode, setEconomicCode] = useState<string>('479100');
  const [taxRegime, setTaxRegime] = useState<'pro_pyme_general' | 'pro_pyme_transparente'>('pro_pyme_general');
  const [complianceChecked, setComplianceChecked] = useState<{ [itemKey: string]: boolean }>({
    ley21713_iva: true,
    spa_empresa_dia: true,
    rut_sii: true,
    dte_boleta_39: false,
    aduanas_din_500: true,
    sernac_garantia_6m: true,
    derecho_retracto: true,
    politica_devolucion: true
  });

  const toggleComplianceItem = (itemKey: string) => {
    setComplianceChecked((prev) => ({
      ...prev,
      [itemKey]: !prev[itemKey]
    }));
  };

  const totalComplianceKeys = Object.keys(complianceChecked).length;
  const passedComplianceKeys = Object.values(complianceChecked).filter(Boolean).length;
  const complianceScorePct = totalComplianceKeys > 0 ? Math.round((passedComplianceKeys / totalComplianceKeys) * 100) : 100;

  // 4. Logistics
  const [courierVolumeMonthly, setCourierVolumeMonthly] = useState<number>(450);
  const [selectedCourier, setSelectedCourier] = useState<'blue_express' | 'starken' | 'chilexpress' | 'chazki'>('blue_express');
  const [fulfillmentModel, setFulfillmentModel] = useState<'in_house' | '3pl'>('3pl');
  const [boxLengthCm, setBoxLengthCm] = useState<number>(24);
  const [boxWidthCm, setBoxWidthCm] = useState<number>(18);
  const [boxHeightCm, setBoxHeightCm] = useState<number>(10);
  const [boxWeightKg, setBoxWeightKg] = useState<number>(0.65);

  // 5. Sprint Tasks State (Persisted)
  const [completedTasks, setCompletedTasks] = useState<{ [taskId: string]: boolean }>(() => {
    try {
      const saved = localStorage.getItem('dropship_sprint_tasks_2026');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      d1_t1: true,
      d1_t2: true,
      d2_t1: true,
      d3_t1: true,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('dropship_sprint_tasks_2026', JSON.stringify(completedTasks));
    } catch (e) {
      console.error(e);
    }
  }, [completedTasks]);

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const resetAllTasks = () => setCompletedTasks({});
  const checkAllTasks = () => {
    const allDone: { [taskId: string]: boolean } = {};
    SPRINT_7_DAYS.forEach((d) => d.tasks.forEach((t) => (allDone[t.id] = true)));
    setCompletedTasks(allDone);
  };

  const allTaskIds = SPRINT_7_DAYS.flatMap((d) => d.tasks.map((t) => t.id));
  const totalTasksCount = allTaskIds.length;
  const completedTasksCount = allTaskIds.filter((id) => completedTasks[id]).length;
  const sprintProgressPct = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // 6. Tickets
  const [escalatedTickets, setEscalatedTickets] = useState<EscalationTicket[]>([]);
  const addEscalatedTicket = (ticket: EscalationTicket) => {
    setEscalatedTickets((prev) => [ticket, ...prev]);
  };
  const updateTicketStatus = (id: string, status: EscalationTicket['status']) => {
    setEscalatedTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
  };
  const activeTicketsCount = escalatedTickets.filter(
    (t) => t.status === 'en_atencion' || t.status === 'abierto'
  ).length;

  // 7. Navigation
  const [activeTab, setActiveTab] = useState<string>('auditoria');

  return (
    <AppContext.Provider
      value={{
        exchangeRate,
        setExchangeRate,
        selectedNicheId,
        setSelectedNicheId,
        productName,
        setProductName,
        supplierCostUSD,
        setSupplierCostUSD,
        shippingCostUSD,
        setShippingCostUSD,
        salePriceCLP,
        setSalePriceCLP,
        gatewayType,
        setGatewayType,
        customAdCpa,
        setCustomAdCpa,
        returnRatePct,
        setReturnRatePct,
        financialResult,
        economicCode,
        setEconomicCode,
        taxRegime,
        setTaxRegime,
        complianceChecked,
        toggleComplianceItem,
        complianceScorePct,
        courierVolumeMonthly,
        setCourierVolumeMonthly,
        selectedCourier,
        setSelectedCourier,
        fulfillmentModel,
        setFulfillmentModel,
        boxLengthCm,
        setBoxLengthCm,
        boxWidthCm,
        setBoxWidthCm,
        boxHeightCm,
        setBoxHeightCm,
        boxWeightKg,
        setBoxWeightKg,
        completedTasks,
        toggleTask,
        resetAllTasks,
        checkAllTasks,
        completedTasksCount,
        totalTasksCount,
        sprintProgressPct,
        escalatedTickets,
        addEscalatedTicket,
        updateTicketStatus,
        activeTicketsCount,
        activeTab,
        setActiveTab,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): GlobalEcommerceState => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
