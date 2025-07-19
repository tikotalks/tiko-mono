import type { TranslationSchema } from '../types'
import { extendLocale } from '../utils'
import { pt } from './base/pt'

export const ptBR: TranslationSchema = extendLocale(pt, {
  // Brazilian Portuguese specific overrides
  common: {
    save: 'Salvar', // Brazil uses 'salvar' instead of 'guardar'
    delete: 'Excluir', // Brazil prefers 'excluir' over 'eliminar'
    close: 'Fechar',
    settings: 'Configurações', // Brazil uses 'configurações' instead of 'definições'
  },
  auth: {
    password: 'Senha', // Brazil uses 'senha' instead of 'palavra-passe'
    confirmPassword: 'Confirmar senha',
    forgotPassword: 'Esqueceu a senha?',
    resetPassword: 'Redefinir senha',
    changePassword: 'Alterar senha',
    currentPassword: 'Senha atual',
    newPassword: 'Nova senha',
    passwordRequired: 'Senha obrigatória',
    passwordTooShort: 'Senha muito curta',
    passwordMismatch: 'As senhas não coincidem',
    wrongPassword: 'Senha incorreta',
    weakPassword: 'Senha fraca',
    login: 'Entrar', // Brazil often uses 'entrar' for login
    logout: 'Sair',
    signUp: 'Cadastrar', // Brazil uses 'cadastrar' for sign up
    email: 'E-mail',
    emailAddress: 'Endereço de e-mail',
    enterEmail: 'Digite seu e-mail', // Brazil uses 'digite' instead of 'introduza'
  },
  settings: {
    title: 'Configurações',
    userSettings: 'Configurações do usuário', // Brazil uses 'usuário' instead of 'utilizador'
    changePassword: 'Alterar senha',
    failedToSave: 'Falha ao salvar configurações',
    passwordChangeNotImplemented: 'Alteração de senha ainda não implementada'
  },
  timer: {
    reset: 'Reiniciar', // Brazil uses 'reiniciar' instead of 'repor'
  },
  cards: {
    delete: 'Excluir',
    deleteCard: 'Excluir cartão',
    deleteThisCard: 'Excluir este cartão?',
    deleteSelectedCards: 'Excluir {count} cartões?',
    uploadImage: 'Enviar imagem', // Brazil uses 'enviar' for upload
  },
  todo: {
    delete: 'Excluir',
    deleteGroup: 'Excluir grupo',
    deleteItem: 'Excluir item',
    deleteItemQuestion: 'Excluir item?',
    deleteTodoList: 'Excluir lista de tarefas?',
    deleteTodoListConfirm: 'Tem certeza que deseja excluir "{title}" e todos os seus itens?',
    deleteItemConfirm: 'Tem certeza que deseja excluir "{title}"?',
    todoListDeleted: 'Lista de tarefas excluída',
    itemDeleted: 'Item excluído',
    saveChanges: 'Salvar alterações',
    uploadImagePrompt: 'Envie uma imagem para tornar a tarefa mais visual'
  },
  radio: {
    saveSettings: 'Salvar configurações',
    failedToSaveSettings: 'Falha ao salvar configurações. Por favor tente novamente.',
    failedToSaveChanges: 'Falha ao salvar alterações. Por favor tente novamente.',
    deleteTrackConfirm: 'Tem certeza que deseja excluir "{title}"?',
  },
  profile: {
    changePassword: 'Alterar senha',
    profileUpdated: 'Perfil atualizado com sucesso',
    imageProcessingFailed: 'Falha ao processar a imagem'
  }
})