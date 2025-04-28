import { useParams } from 'react-router-dom';
import { TransactionPage } from '@/components/TransactionPage';

export function TransactionRoute() {
  const { txId } = useParams<{ txId: string }>();
  
  return (
    <TransactionPage txId={txId} />
  );
}
