import { useCollection } from "../../hooks";
import { LayerConfig } from "../../types";
import LayerFormWithDatePicker from "./LayerFormWithDatePicker";

type LayerFormProps = {
  config: LayerConfig;
  updateLayer: (config: LayerConfig) => void;
}

function LayerForm({ config, updateLayer }: LayerFormProps) {
  const { collection: collectionId } = config.renderConfig;
  const { collection, isLoading } = useCollection(collectionId);

  if (isLoading) {
    return <p>Loading...</p>
  }

  if (!collection) {
    return <p>Collection not found.</p>;
  }

  const timeseriesType = collection.timeseriesType;

  if (timeseriesType === 'forecast') {
    return <LayerFormWithDatePicker config={config} collection={collection.stac} collectionConfig={collection} updateLayer={updateLayer} />
  }

  return null;
}

export default LayerForm;
