import { Source, Layer as GlLayer } from 'react-map-gl';
import { CollectionConfig, LayerConfig } from '../../types';
import { useCollection } from '../../hooks';
import { renderConfigToUrlParams } from '../../utils';

type Props = {
  config: LayerConfig
  beforeId?: string
}

function getZeroPaddedHourDifference(date1: Date, date2: Date) {
  // Calculate the difference in hours
  const hoursDifference = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60);
  // Convert to integer and pad with zeros
  return Math.floor(hoursDifference).toString().padStart(2, '0');
}

// async function querySTACAndExtractBytes(collection: CollectionConfig, datetime_str: string, reference_dt_str: string, variable_name: string): <start_byte: number, end_byte: number> {
//   // Construct the STAC query URL
//   const stacUrl = collection.collectionStacUrl;
//   const queryParams = new URLSearchParams({
//     datetime: datetime_str,
//     "forecast:reference_time": reference_dt_str,
//   });
//   const url = `${stacUrl}?${queryParams}`;

//   try {
//     const response = await fetch(url);
//     if (!response.ok) {
//       throw new Error(`STAC API request failed: ${response.statusText}`);
//     }
//     const data = await response.json();
//     // Assuming the first item in the collection is the one we're interested in
//     const item = data.features[0];
//     if (!item) {
//       throw new Error("No matching items found");
//     }
//     const asset = item.assets[variable_name];
//     if (!asset) {
//       throw new Error(`No asset found for variable: ${variable_name}`);
//     }
//     // Extract start_byte and end_byte
//     const { start_byte, end_byte } = asset;
//     return { start_byte, end_byte };
//   } catch (error) {
//     console.error("Error querying STAC and extracting bytes:", error);
//     throw error; // Rethrow or handle as needed
//   }
// }

// !!!Temporary - to be replaced by STAC item search
function generateVrtString(reference_dt_str: string, datetime_str: string) {
  const reference_datetime = new Date(reference_dt_str);
  const datetime = new Date(datetime_str);
  const forecast_hour = getZeroPaddedHourDifference(datetime, reference_datetime);
  const year = reference_datetime.getUTCFullYear();
  const month = String((reference_datetime.getUTCMonth() + 1)).padStart(2, '0'); // getUTCMonth() returns 0-11, so we add 1
  const day = String(reference_datetime.getUTCDate()).padStart(2, '0');
  const hour = String(reference_datetime.getUTCHours()).padStart(2, '0');
  const blobContainer = "https://noaahrrr.blob.core.windows.net/hrrr"
  // TODO: define this in the collection
  const product = 'sfc';
  const gribUrl = `${blobContainer}/hrrr.${year}${month}${day}/conus/hrrr.t${hour}z.wrf${product}f${forecast_hour}.grib2`;
  const grib_message = 9
  return `vrt:///vsicurl/${gribUrl}?bands=${grib_message}`
}

function Layer({ config, beforeId }: Props) {
  const { id } = config;
  const { collection: collectionId, variable, renderOption, datetime_str, reference_dt_str } = config.renderConfig;
  const { collection } = useCollection(collectionId);

  if (!collection) return null;

  const { minmax_zoom, ...renders } = collection.stac.renders[renderOption!]

  if (!(reference_dt_str && datetime_str)) return null;

  // if the option is "forecast", then it should be the most recent item from the set of 00, 06, 12, 18
  const renderConfig = {
    url: generateVrtString(reference_dt_str, datetime_str),
    scale: 1,
    ...renders
  }
  const { tiler } = collection;
  const tileUrl = `${tiler}?${renderConfigToUrlParams(renderConfig)}`;

  if (!config.isVisible) {
    return null;
  }

  return (
    <Source
      id={id}
      type="raster"
      tiles={[tileUrl]}
      tileSize={256}
    >
      <GlLayer
        id={id}
        type="raster"
        beforeId={beforeId}
        minzoom={minmax_zoom ? minmax_zoom[0] : 0}
        maxzoom={minmax_zoom ? minmax_zoom[1] : 22}
      />
    </Source>
  );
}

export default Layer;
