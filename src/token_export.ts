import { GetLocalVariablesResponse, LocalVariable } from '@figma/rest-api-spec'
import { rgbToHex } from './color.js'

function tokenTypeFromVariable(variable: LocalVariable) {
  switch (variable.resolvedType) {
    case 'BOOLEAN':
      return 'boolean'
    case 'COLOR':
      return 'color'
    case 'FLOAT':
      return 'number'
    case 'STRING':
      return 'string'
  }
}

function tokenValueFromVariable(
  variable: LocalVariable,
  modeId: string,
  localVariables: { [id: string]: LocalVariable },
) {
  const value = variable.valuesByMode[modeId]
  if (typeof value === 'object') {
    if ('type' in value && value.type === 'VARIABLE_ALIAS') {
      const aliasedVariable = localVariables[value.id]
      return `${aliasedVariable.name}`
    } else if ('r' in value) {
      return rgbToHex(value)
    }

    throw new Error(`Format of variable value is invalid: ${value}`)
  } else {
    return value
  }
}

function isAliasVariable(
  variable: LocalVariable,
  modeId: string
): boolean {
  const value = variable.valuesByMode[modeId];
  return typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    value.type === 'VARIABLE_ALIAS';
}

export function tokenFilesFromLocalVariables(localVariablesResponse: GetLocalVariablesResponse) {
  const collections: { name: string; modes: any[] }[] = [];
  const localVariableCollections = localVariablesResponse.meta.variableCollections;
  const localVariables = localVariablesResponse.meta.variables;

  Object.values(localVariableCollections).forEach((collection) => {
    const modes = collection.modes.map((mode) => {
      return {
        name: mode.name,
        variables: Object.values(localVariables)
          .filter((variable) => !variable.remote && variable.variableCollectionId === collection.id)
          .map((variable) => ({
            name: variable.name,
            type: tokenTypeFromVariable(variable),
            isAlias: isAliasVariable(variable, mode.modeId),
            value: tokenValueFromVariable(variable, mode.modeId, localVariables),
          })),
      };
    });

    collections.push({
      name: collection.name,
      modes,
    });
  });

  return {
    "variables-3-9-3.json": collections,
  };
}
