import './OnboardingHeader.styles.scss';

import { getAssetUrl } from 'utils/basePath';

export function OnboardingHeader(): JSX.Element {
	return (
		<div className="header-container">
			<div className="logo-container">
				<img src={getAssetUrl('/Logos/signoz-brand-logo.svg')} alt="SigNoz" />
				<span className="logo-text">SigNoz</span>
			</div>
		</div>
	);
}
