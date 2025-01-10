import BasicModal from "@/components/modals/basicModal/BasicModal"
import useModal from "@/hooks/useModalBasic"


export default function btnWithModal({WrappedComponent, renderContent, props, }){
    const {close, handleClose, renderModal, modalContent} = useModal()
    const rest = {
        onClick: renderModal(renderContent),
        ...props
    }
    return <>
        <WrappedComponent {...rest}/>
        {close && <BasicModal close={handleClose} renderContent={modalContent} />}
    </>
}