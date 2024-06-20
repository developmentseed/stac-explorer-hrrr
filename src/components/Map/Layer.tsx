import { Source, Layer as GlLayer } from 'react-map-gl';
import { LayerConfig } from '../../types';
import { useCollection } from '../../hooks';
import { generateVrtString, renderConfigToUrlParams } from '../../utils';
import { useEffect, useState } from 'react';

type Props = {
  config: LayerConfig
  beforeId?: string
}

function Layer({ config, beforeId }: Props) {
  const { id } = config;
  const { collection: collectionId, renderOption = '', datetime_str, reference_dt_str } = config.renderConfig;
  const { collection } = useCollection(collectionId);

  // Store already VRT GRIB URLs already fetched for a given layer
  const [urls, setUrls] = useState<Map<string, string>>(new Map<string, string>());
  const [currentUrl, setCurrentUrl] = useState<string>('');
  useEffect(() => {
    if (!datetime_str || !reference_dt_str) return;
    const datetimes_key = [datetime_str, reference_dt_str].join(',')
    const memoizedUrl = urls.get(datetimes_key)
    // Function to update the Map state
    const updateUrlsState = (key: string, value: string) => {
      setUrls(prevMap => {
        const newMap = new Map(prevMap);
        newMap.set(key, value);
        return newMap;
      });
    };
    if (memoizedUrl) {
      setCurrentUrl(memoizedUrl)
    } else {
      const newUrl = generateVrtString(reference_dt_str, datetime_str)
      updateUrlsState(datetimes_key, newUrl);
      setCurrentUrl(newUrl)
    }
  }, [datetime_str, reference_dt_str, urls])

  if (!collection) return null;

  const { minmax_zoom, ...renders } = collection.stac.renders[renderOption!]

  if (!(reference_dt_str && datetime_str)) return null;

  // TODO: the option is "forecast", then it should be the most recent item from the set of 00, 06, 12, 18
  const renderConfig = {
    url: currentUrl,
    scale: 1,
    ...renders
  }
  const { tiler } = collection;
  const tileUrl = `${tiler}?${renderConfigToUrlParams(renderConfig)}`;

  if (!config.isVisible) {
    return null;
  }

  if (!currentUrl) {
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
