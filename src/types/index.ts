import { StacCollection as Collection } from "stac-ts";

type GenericObject = {
  [key: string]: any  // eslint-disable-line @typescript-eslint/no-explicit-any
}

export type StacRenderObject = {
  assets: string[];
  title?: string;
  rescale?: [number, number];
  nodata?: number | string;
  colormap_name?: string;
  colormap?: GenericObject;
  color_formula?: string;
  resampling?: string;
  expression?: string;
  band_regex?: string;
  bands?: string;
  variable?: string;
  minmax_zoom?: number[];
}

export type StacRender = {
  renders: {[key: string]: StacRenderObject};
}

export type DataCubeCollection = {
  "cube:dimensions": GenericObject;
  "cube:variables": GenericObject;
} & StacRender;


export type StacCollection = Collection & DataCubeCollection;

export type CollectionConfig = {
  id: string;
  collectionStacUrl: string;
  stacSearchUrl: string;
  displayName: string;
  tiler: string;
  timeseriesType?: "forecast" | "historical";
  lastAvaliableDatetime?: string;
  stac: StacCollection;
}

export type LayerConfig = {
  id: string;
  name: string;
  isVisible: boolean;
  timeseriesType?: "forecast" | "historical";
  renderConfig: {
    collection: string;
    variable: string;
    renderOption?: string;
    datetimeStr?: string;
    referenceDtStr?: string;
  }
}

export type GribItemsResponse = {
  features: {
    assets: {
      grib: {
        href: string;
        'grib:layers': {
          [key: string]: {
            'grib_message': string;
          };
        };
      };
    };
  }[];
};
