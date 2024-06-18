import { Alert, AlertDescription, AlertIcon, AlertTitle } from "@chakra-ui/alert";
import { Button, FormControl, FormErrorMessage, Radio, RadioGroup, Stack } from "@chakra-ui/react";
import { useForm, Controller, SubmitHandler } from "react-hook-form"
import { SelectProps } from "./types";
import { getMostRecentUTC } from "../../../utils";

type FormValues = {
  renderOption: string;
  datetime: string;
}

function VariablesSelect({ collection, addLayer }: SelectProps) {
  const { stac } = collection;
  const cubeVariables = stac['cube:variables'];
  const renderOptions = Object.keys(stac.renders);
  const temporal = stac.extent.temporal;
  const lastTemporalExtent = temporal.interval[0][1];
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
      datetime_str: maxDatetimeStr ?? undefined,
      reference_dt_str: maxDatetimeStr ?? undefined
    }

    addLayer({
      id: crypto.randomUUID(),
      name: collection.id,
      isVisible: true,
      timeseries_type: collection.timeseries_type,
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
                      {option}
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
