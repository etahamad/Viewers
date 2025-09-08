import { useUserAuthentication } from '@ohif/ui-next';
import { useLocation } from 'react-router-dom';
import { shouldBypassAuthentication } from '../utils/tokenAuth';

export const PrivateRoute = ({ children, handleUnauthenticated }) => {
  const [{ user, enabled }] = useUserAuthentication();
  const location = useLocation();
  
  // Get services for token authentication check
  const servicesManager = window.servicesManager;
  const userAuthenticationService = servicesManager?.services?.userAuthenticationService;

  // Check if authentication should be bypassed for token users
  const bypassAuth = userAuthenticationService && shouldBypassAuthentication(userAuthenticationService, location);

  if (enabled && !user && !bypassAuth) {
    return handleUnauthenticated();
  }

  return children;
};

export default PrivateRoute;
