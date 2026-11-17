// Al hacer commit: revisa y formatea solo lo modificado.
const configuracion = {
  '*.{ts,tsx,js,mjs,mts}': ['eslint --max-warnings 0 --fix', 'prettier --write'],
  '*.{json,md,css,yml,yaml}': ['prettier --write'],
};

export default configuracion;
