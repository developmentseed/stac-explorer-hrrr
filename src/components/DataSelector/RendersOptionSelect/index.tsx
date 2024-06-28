import { Alert, AlertDescription, AlertIcon, AlertTitle } from "@chakra-ui/alert";
import { Button, FormControl, FormErrorMessage, Radio, RadioGroup, Stack } from "@chakra-ui/react";
import { useForm, Controller, SubmitHandler } from "react-hook-form"
import { SelectProps } from "./types";
import { getMostRecentUTC } from "../../../utils";

type FormValues = {
  renderOption: string;
  datetime: string;
}

function removeDuplicates(dictList: Record<string, any>, key: string) {
  const seen = new Set();
  const uniqueList: typeof dictList = {};

  for (const [renderKey, value] of Object.entries(dictList)) {
    if (!seen.has(value[key])) {
      uniqueList[renderKey] = value;
      seen.add(value[key]);
    }
  }  

  return uniqueList;
}

function VariablesSelect({ collection, addLayer }: SelectProps) {
  const { stac } = collection;
  const stacRenders = removeDuplicates(stac.renders, 'title');
  const renderOptions = Object.keys(stacRenders);
  const temporal = stac.extent.temporal;
  const lastTemporalExtent = temporal.interval[0][1] || collection.lastAvaliableDatetime;
  // We may never fall back to getMostRecentUTC unless we have a real-time ingestion pipeline.
  const maxDatetimeStr = lastTemporalExtent ? lastTemporalExtent : getMostRecentUTC().toISOString();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  const onSubmit: SubmitHandler<FormValues> = ({ renderOption }) =>{
    let renderConfig = {
      renderOption,
      collection: collection.id,
      variable: renderOption,
      datetimeStr: maxDatetimeStr ?? undefined,
      referenceDtStr: maxDatetimeStr ?? undefined
    }

    addLayer({
      id: crypto.randomUUID(),
      name: collection.id,
      isVisible: true,
      timeseriesType: collection.timeseriesType,
      renderConfig
    });
  };

  if (renderOptions) {
    return (
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormControl isInvalid={!!errors.renderOption}>
          <legend>Select a layer option</legend>
          <Controller
            name="renderOption"
            control={control}
            render={({ field }) => (
              <RadioGroup {...field}>
                <Stack direction="column">
                  {renderOptions.map(option => (
                    <Radio
                      key={option}
                      value={option}
                      isDisabled={!renderOptions.includes(option)}
                    >
                      {stac.renders[option].title}
                    </Radio>
                  ))}
                </Stack>
              </RadioGroup>
            )}
            rules={{ required: 'Select a layer option.' }}
          />
          {errors.renderOption && <FormErrorMessage>{errors.renderOption.message}</FormErrorMessage>}
        </FormControl>
        <Button type="submit">Add layer</Button>
      </form>
    );   
  } else {
    return (
      <Alert status="warning">
        <AlertIcon />
        <AlertTitle>Data from this collection cannot be visualized.</AlertTitle>
        <AlertDescription>The collection does not implement the datacube or render STAC extenstions.</AlertDescription>
      </Alert>
    );
  }
}

export default VariablesSelect;
