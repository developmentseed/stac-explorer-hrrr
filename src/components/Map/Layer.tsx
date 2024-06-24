import { Source, Layer as GlLayer } from 'react-map-gl';
import { LayerConfig } from '../../types';
import { useCollection } from '../../hooks';
import { renderConfigToUrlParams, fetchData } from '../../utils';
import { useEffect, useState } from 'react';

type Props = {
  config: LayerConfig
  beforeId?: string
}

function Layer({ config, beforeId }: Props) {
  const { id } = config;
  const { collection: collectionId, renderOption = '', datetimeStr, referenceDtStr } = config.renderConfig;
  const { collection } = useCollection(collectionId);

  // Use state to store previously generated grib vrt asset URLs.
  // These only exist while the layer is mounted.
  const [urls, setUrls] = useState<Map<string, string>>(new Map<string, string>());
  const [currentUrl, setCurrentUrl] = useState<string>('');

  useEffect(() => {
    if (!datetimeStr || !referenceDtStr) return;
    const datetimes_key = [datetimeStr, referenceDtStr].join(',')
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
      if (!collection) {
        return  ;
      }
  
      fetchData(collection, collectionId, referenceDtStr, datetimeStr, renderOption).then((newUrl) => {
        setCurrentUrl(newUrl);
        updateUrlsState(datetimes_key, newUrl);
      })
    };
  }, [datetimeStr, referenceDtStr, collection, collectionId, urls, renderOption])

  if (!collection) return null;

  const { minmax_zoom, ...renders } = collection.stac.renders[renderOption!]

  if (!(referenceDtStr && datetimeStr)) return null;

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
