import React from 'react';
import { NicheValidationTab } from './tabs/NicheValidationTab';

interface NichesAndValidationProps {
  exchangeRate: number;
  onSelectNicheForCalc?: (nicheId: string) => void;
}

export const NichesAndValidation: React.FC<NichesAndValidationProps> = (props) => {
  return <NicheValidationTab {...props} />;
};

export default NichesAndValidation;
