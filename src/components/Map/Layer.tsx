import { Source, Layer as GlLayer } from 'react-map-gl';
import { LayerConfig, CollectionConfig } from '../../types';
import { useCollection } from '../../hooks';
import { generateVrtString, renderConfigToUrlParams, querySTACAndExtractBytes } from '../../utils';
import { useEffect, useState } from 'react';
import { debug } from 'console';

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
      // const newUrl = generateVrtString(reference_dt_str, datetime_str)
      // Construct the STAC query URL
      if (!collection) {
        // Handle the case where collection is undefined, maybe return null or show a loading indicator
        return  ;
      }
      const { stacSearchUrl } = collection;
      // Construct the search query
      const searchQuery = {
        "collections": [
            collectionId
        ],
        "filter": {
        "and": [
            {
                "=": [
                    {
                    "property": "properties.forecast:reference_time"
                    },
                    reference_dt_str.replace('Z', '') // Temporary
                ]
            },
            {
                "=": [
                    {
                    "property": "properties.datetime"
                    },
                    datetime_str
                ]
            }
        ]
        },
        "filter-lang": "cql-json"
     };
      // Send the POST request
      const fetchData = async() => {
        fetch(stacSearchUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(searchQuery)
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          // debugger;
          // updateUrlsState(datetimes_key, newUrl);
          // setCurrentUrl(newUrl)
          return response.json();
        })
        .then(data => {
          console.log('Search Results:', JSON.stringify(data, null, 2));
        })
        .catch(error => {
          console.error('Error:', error);
        });
      }
      fetchData();
    }
  }, [datetime_str, reference_dt_str, collection, urls])

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
