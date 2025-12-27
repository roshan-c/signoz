import { getAssetUrl } from 'utils/basePath';

function NotFound(): JSX.Element {
	return (
		<img
			style={{
				maxHeight: 480,
				maxWidth: 480,
			}}
			src={getAssetUrl('/Images/notFound404.png')}
			alt="not-found"
		/>
	);
}

export default NotFound;
