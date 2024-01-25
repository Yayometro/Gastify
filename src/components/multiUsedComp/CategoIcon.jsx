import * as icons from 'react-icons/md';

const CategoIcon = ({type, siz}) => {
  const Icon = icons[type];
  return <Icon size={siz} />; 
};

export default CategoIcon