import * as icons from 'react-icons/md';

const CategoIcon = ({type, siz, className}) => {
  const Icon = icons[type];
  return <Icon size={siz} className={className}/>; 
};

export default CategoIcon