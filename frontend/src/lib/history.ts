import { createBrowserHistory } from 'history';

import { getRouterBasename } from 'utils/basePath';

// Get the base path for router configuration
// This allows the app to be served from a sub-path (e.g., /signoz/)
const basename = getRouterBasename();

export default createBrowserHistory({
	basename: basename || undefined,
});
