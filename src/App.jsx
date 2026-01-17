import { AddressSearch } from '../features/planner/AddressSearch';
import { useRouteStore } from '../store/useRouteStore';
import { MapPin, Flag } from 'lucide-react';

// ... dentro do componente
const setOrigin = useRouteStore((state) => state.setOrigin);
const setDestination = useRouteStore((state) => state.setDestination);

return (
  <div className="flex flex-col gap-3">
    <AddressSearch 
      placeholder="De onde você sai?" 
      onSelect={setOrigin} 
      icon={MapPin} 
    />
    <AddressSearch 
      placeholder="Para onde você vai?" 
      onSelect={setDestination} 
      icon={Flag} 
    />
  </div>
);