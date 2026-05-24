'use server';

import { prisma } from '@/lib/prisma';

export async function submitLead(formData: FormData) {
  const negocio = formData.get('negocio') as string;
  const email = formData.get('email') as string;

  if (!negocio || !email) {
    return { error: 'Por favor, llena todos los campos.' };
  }

  try {
    await prisma.prospecto.create({
      data: {
        negocio,
        email,
      },
    });
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'Este correo ya está registrado.' };
    }
    return { error: 'Ocurrió un error al guardar los datos.' };
  }
}