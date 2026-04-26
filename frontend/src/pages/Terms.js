import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Clock, AlertTriangle, CreditCard, Ban, UserCheck, Scale } from "lucide-react";

const sections = [
  {
    icon: UserCheck,
    title: "1. Registro y cuenta",
    items: [
      "Para reservar una cancha es necesario crear una cuenta con datos reales (nombre completo y email).",
      "Cada usuario es responsable de mantener la confidencialidad de su cuenta.",
      "El complejo se reserva el derecho de suspender cuentas que incumplan estas condiciones.",
    ],
  },
  {
    icon: CreditCard,
    title: "2. Reservas y seña",
    items: [
      "Al realizar una reserva, se requiere el pago de una seña a traves de Mercado Pago.",
      "El pago se puede realizar con tarjeta de credito, debito, transferencia o dinero en cuenta de Mercado Pago.",
      "La reserva se confirma automaticamente una vez que Mercado Pago acredita el pago.",
      "Si el pago no se realiza dentro del tiempo establecido, la reserva sera cancelada automaticamente.",
    ],
  },
  {
    icon: Ban,
    title: "3. Cancelaciones",
    items: [
      "Las cancelaciones son gestionadas exclusivamente por el staff o administradores del complejo.",
      "Los usuarios no pueden cancelar reservas por su cuenta una vez realizadas.",
      "En caso de necesitar cancelar, el usuario debe comunicarse con el complejo.",
      "El reembolso de la seña queda a criterio del complejo segun el caso.",
    ],
  },
  {
    icon: Clock,
    title: "4. Puntualidad y uso",
    items: [
      "Se solicita llegar al menos 10 minutos antes del horario reservado.",
      "El tiempo de juego comienza a la hora reservada, independientemente de la hora de llegada.",
      "El usuario es responsable del correcto uso de las instalaciones durante su turno.",
    ],
  },
  {
    icon: AlertTriangle,
    title: "5. Responsabilidades",
    items: [
      "El complejo no se responsabiliza por lesiones ocurridas durante la practica deportiva.",
      "Los jugadores participan bajo su propia responsabilidad.",
      "Cualquier daño intencional a las instalaciones sera responsabilidad del usuario que realizo la reserva.",
    ],
  },
  {
    icon: Shield,
    title: "6. Datos personales",
    items: [
      "Los datos recopilados (nombre, email) se utilizan exclusivamente para la gestion de reservas y comunicaciones del complejo.",
      "No se comparten datos personales con terceros.",
      "El usuario puede solicitar la eliminacion de su cuenta y datos contactando al complejo.",
    ],
  },
  {
    icon: Scale,
    title: "7. Modificaciones",
    items: [
      "El complejo se reserva el derecho de modificar estos terminos en cualquier momento.",
      "Los cambios seran comunicados a traves de la plataforma.",
      "El uso continuado del servicio implica la aceptacion de los terminos vigentes.",
    ],
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-white transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </Link>

        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
            Terminos y Condiciones
          </h1>
          <p className="text-[#A1A1AA] text-sm">
            Al registrarte y utilizar nuestro servicio de reservas, aceptas los siguientes terminos y condiciones.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, i) => {
            const Icon = section.icon;
            return (
              <div key={i} className="bg-[#161618] border border-white/10 rounded-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-sm bg-[#ccff00]/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-[#ccff00]" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">{section.title}</h2>
                </div>
                <ul className="space-y-2.5 ml-12">
                  {section.items.map((item, j) => (
                    <li key={j} className="text-sm text-[#A1A1AA] leading-relaxed flex items-start gap-2">
                      <span className="text-[#ccff00]/50 mt-1.5 flex-shrink-0">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="mt-10 text-center">
          <p className="text-xs text-[#A1A1AA]/60">
            Ultima actualizacion: Marzo 2026
          </p>
          <Link to="/auth?tab=register">
            <Button className="mt-4 bg-[#ccff00] text-black font-bold uppercase tracking-wide hover:bg-[#b3e600] rounded-sm px-8 py-3 text-sm h-auto">
              Crear cuenta
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
