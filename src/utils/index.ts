import { parse } from "tinyduration";
import { CollectionConfig, StacRenderObject, GribItemsResponse } from "../types";

export function renderConfigToUrlParams(config: StacRenderObject): string {
  const { title, assets, ...params } = config;

  const queryObj: { [key: string]: string } = {};

  for (const [key, value] of Object.entries(params)) {
    if (!value) continue;

    if (Array.isArray(value) && key !== 'colormap') {
      queryObj[key] = value.join(',');
    } else if(key === 'colormap') {
      const jsonString = JSON.stringify(value);
      // URL-encode the JSON string
      queryObj[key] = jsonString; //encodeURIComponent(jsonString);
    }else {
      queryObj[key] = `${value}`;
    }
  }

  const searchParams = new URLSearchParams(queryObj);

  if (assets) {
    for (let i = 0, len = assets.length; i < len; i++) {
      searchParams.append('bands', assets[i]);
    }
  }

  return searchParams.toString();
}


export function durationToMs(duration: string): number {
  const { days, hours, minutes, seconds } = parse(duration);
  const interval = 
    (seconds || 0) * 1000 +
    (minutes || 0) * 60 * 1000 + 
    (hours || 0) * 60 * 60 * 1000 + 
    (days || 0) * 24 * 60 * 60 * 1000;
  return interval;
}

export function epochToDisplayDate(epoch?: number): string | undefined {
  return epoch ? new Date(epoch).toUTCString() : undefined;
}

export function convertToUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()));
}

export function getMostRecentUTC(): Date {
  const now = new Date();
  const currentHour = now.getUTCHours();
  const month = now.getUTCMonth();
  const year = now.getUTCFullYear();

  let recentHour;

  if (currentHour >= 18) {
    recentHour = 18;
  } else if (currentHour >= 12) {
    recentHour = 12;
  } else if (currentHour >= 6) {
    recentHour = 6;
  } else {
    recentHour = 0;
  }

  const mostRecentDateTime = new Date(Date.UTC(year, month, now.getUTCDate(), recentHour));
  return mostRecentDateTime;
}

export function generateVrtString(data: GribItemsResponse, renderOption: string) {
  const gribAsset = data.features[0].assets.grib;
  const gribAssetUrl = gribAsset.href;
  // const renderOptionAllSets = render
  let variableData = gribAsset['grib:layers'][renderOption];
  if (!variableData) {
    const forecastSetAlternate = renderOption.replace(/analysis|point_in_time|instantaneous|periodic_max/g, function(match) {
      switch (match) {
        case 'analysis':
          return 'point_in_time';
        case 'point_in_time':
          return 'analysis';
        case 'instantaneous':
          return 'periodic_max';
        case 'periodic_max':
          return 'instantaneous';
        default:
          return ''; // Add a default return value here
      }
    });
    variableData = gribAsset['grib:layers'][forecastSetAlternate];
  }
  const gribMessage = variableData['grib_message'];
  return `vrt:///vsicurl/${gribAssetUrl}?bands=${gribMessage}`
}

export async function fetchData(collection: CollectionConfig, collectionId: string, referenceDtStr: string, datetimeStr: string): Promise<GribItemsResponse> {
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
                referenceDtStr
            ]
        },
        {
            "=": [
                {
                "property": "properties.datetime"
                },
                datetimeStr
            ]
        }
    ]
    },
    "filter-lang": "cql-json"
  };  
  return fetch(stacSearchUrl, {
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
    return response.json();
  })
  .catch(error => {
    console.error('Error:', error);
    throw new Error('Failed to fetch data');
  });
}
