import BasicModal from "@/components/modals/basicModal/BasicModal"
import useModal from "@/hooks/useModalBasic"


function BtnWithModal({wrappedComponent, renderContent, props }) {
    const {close, handleClose, renderModal} = useModal()
    const rest = {
        onClick: renderModal(),
        ...props
    }
  return <>
  <wrappedComponent {...rest}/>
  {close && <BasicModal close={handleClose} renderContent={renderContent} />}
</>
}

export default BtnWithModal
