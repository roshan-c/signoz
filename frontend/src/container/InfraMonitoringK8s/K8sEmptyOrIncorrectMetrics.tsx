import { Typography } from 'antd';
import { getAssetUrl } from 'utils/basePath';

export default function HostsEmptyOrIncorrectMetrics({
	noData,
	incorrectData,
}: {
	noData: boolean;
	incorrectData: boolean;
}): JSX.Element {
	return (
		<div className="hosts-empty-state-container">
			<div className="hosts-empty-state-container-content">
				<img className="eyes-emoji" src={getAssetUrl('/Images/eyesEmoji.svg')} alt="eyes emoji" />

				{noData && (
					<div className="no-hosts-message">
						<Typography.Title level={5} className="no-hosts-message-title">
							No data received yet.
						</Typography.Title>
					</div>
				)}

				{incorrectData && (
					<Typography.Text className="incorrect-metrics-message">
						To see data, upgrade to the latest version of SigNoz k8s-infra chart.
						Please contact support if you need help.
					</Typography.Text>
				)}
			</div>
		</div>
	);
}
