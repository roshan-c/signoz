import './HeroSection.style.scss';

import { useIsDarkMode } from 'hooks/useDarkMode';
import { getAssetUrl } from 'utils/basePath';

import AccountActions from './components/AccountActions';

function HeroSection(): JSX.Element {
	const isDarkMode = useIsDarkMode();
	return (
		<div
			className="hero-section"
			style={
				isDarkMode
					? {
							backgroundImage: `url('${getAssetUrl('/Images/integrations-hero-bg.png')}')`,
					  }
					: {}
			}
		>
			<div className="hero-section__icon">
				<img src={getAssetUrl('/Logos/aws-dark.svg')} alt="aws-logo" />
			</div>
			<div className="hero-section__details">
				<div className="title">Amazon Web Services</div>
				<div className="description">
					One-click setup for AWS monitoring with SigNoz
				</div>
				<AccountActions />
			</div>
		</div>
	);
}

export default HeroSection;
