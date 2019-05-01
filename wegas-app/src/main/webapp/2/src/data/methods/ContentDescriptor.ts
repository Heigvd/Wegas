export const getAbsoluteFileName = (file: IFile) => {
  let filePath = file.path;
  if (filePath.substr(-1, 1) === '/') {
    filePath = filePath.substr(0, filePath.length - 1);
  }
  filePath += '/' + file.name;
  return filePath;
};

export const generateGoodPath = (file: IFile) => {
  return file.path.replace(/(\/)$/, '') + '/' + file.name;
};
