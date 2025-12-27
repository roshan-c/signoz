import './Login.styles.scss';

import LoginContainer from 'container/Login';
import { getAssetUrl } from 'utils/basePath';

function Login(): JSX.Element {
	return (
		<div className="login-page-container">
			<div className="perilin-bg" />
			<div className="login-page-content">
				<div className="brand-container">
					<img
						src={getAssetUrl('/Logos/signoz-brand-logo.svg')}
						alt="logo"
						className="brand-logo"
					/>

					<div className="brand-title">SigNoz</div>
				</div>

				<LoginContainer />
			</div>
		</div>
	);
}

export default Login;
