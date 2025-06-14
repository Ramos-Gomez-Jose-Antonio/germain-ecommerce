function previewImage(event, imgId, iconId, wrapperId, labelId) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    const img = document.getElementById(imgId);
    const icon = document.getElementById(iconId);
    const wrapper = document.getElementById(wrapperId);
    const label = document.getElementById(labelId);

    img.src = e.target.result;
    img.style.display = "block";
    if (icon) icon.style.display = "none";
    if (label) label.style.display = "none";

    img.onload = function () {
  if (wrapper) {
    const isMain = wrapperId.includes('main');
    const isThumb = wrapperId.includes('thumb');

    const aspectRatio = img.naturalHeight / img.naturalWidth;
    const baseWidth = wrapper.offsetWidth;
    let newHeight = baseWidth * aspectRatio;

    if (isMain) {
      
      wrapper.style.height = newHeight + 'px';
    }

    if (isThumb) {
      const maxHeight = 250;
      if (newHeight > maxHeight) newHeight = maxHeight;
      wrapper.style.height = newHeight + 'px';
    }
  }
};


  };

  if (file) {
    reader.readAsDataURL(file);
  }
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('FormularioP');
    const imgPrincipal = document.getElementById('img-principal');
    const imgsecun1 = document.getElementById('img-secun1');
    const imgsecun2 = document.getElementById('img-secun2');
    const precio = document.getElementById('precio');
    const cantidadInput = document.getElementById('cantidad');
    const increaseBtn = document.getElementById('increase');
    const decreaseBtn = document.getElementById('decrease');

    function validarImagen(input) {
        const file = input.files[0];
        if (!file) return true;

        const validTypes = ['image/png', 'image/jpeg'];
        if (!validTypes.includes(file.type)) {
            alert('Solo se permiten imágenes de tipo .png o .jpg');
            input.value = '';
            return false;
        }
        return true;
    }

    [imgPrincipal, imgsecun1, imgsecun2].forEach(input => {
        input.addEventListener('change', () => validarImagen(input));
    });

    precio.addEventListener('input', () => {
        if (parseFloat(precio.value) <= 0) {
            precio.setCustomValidity('El precio debe ser mayor a $0');
        } else {
            precio.setCustomValidity('');
        }
    });

    increaseBtn.addEventListener('click', () => {
        let current = parseInt(cantidadInput.value);
        cantidadInput.value = current + 1;
    });

    decreaseBtn.addEventListener('click', () => {
        let current = parseInt(cantidadInput.value);
        if (current > 1) {
            cantidadInput.value = current - 1;
        }
    });

    form.addEventListener('submit', (e) => {
        const imagenesValidas = [imgPrincipal, imgsecun1, imgsecun2].every(input => {
            if (input.files.length > 0) {
                return validarImagen(input);
            }
            return true;
        });
        if (!imagenesValidas) {
            e.preventDefault();
            return;
        }

            const catalogo = document.getElementById('catalogoSelect');
                if (!catalogo.value) {
                    alert('Seleccione un catálogo antes de enviar el formulario.');
                    e.preventDefault();
                    return;
                }



        const campos = form.querySelectorAll('input[required], select[required], textarea[required]');
        let camposValidos = true;

        campos.forEach(campo => {
            if (!campo.value || campo.value.trim() === '') {
                campo.classList.add('campo-invalido');
                camposValidos = false;
            } else {
                campo.classList.remove('campo-invalido');
            }
        });

        if (parseFloat(precio.value) <= 0) {
            alert('El precio debe ser mayor a $0');
            camposValidos = false;
        }

        if (parseInt(cantidadInput.value) < 1) {
            alert('La cantidad del producto debe ser al menos 1');
            camposValidos = false;
        }

        if (!camposValidos) {
            e.preventDefault();
            alert('Por favor, completa todos los campos de manera correcta.');
        }
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const plantelSelect = document.getElementById("plantelSelect");
    const catalogoSelect = document.getElementById("catalogoSelect");

    plantelSelect.addEventListener("change", async () => {
        const plantelId = plantelSelect.value;

        
        catalogoSelect.innerHTML = '<option value="">Seleccione un catálogo</option>';

        if (plantelId) {
            try {
                const response = await fetch(`/api/catalogos/${plantelId}`);
                const catalogos = await response.json();

                catalogos.forEach(c => {
                    if (c.catalogo_id) { 
                        const option = document.createElement("option");
                        option.value = String(c.catalogo_id); 
                        option.textContent = c.nombre;
                        catalogoSelect.appendChild(option);
                    }
                });


            } catch (error) {
                console.error("Error al cargar catálogos:", error);
            }
        }
    });
});

    // ==== MODAL DE USUARIO ====
document.addEventListener('DOMContentLoaded', () => {
    const iconoPerfil = document.getElementById('userProfileToggle');
    const modalOverlay = document.getElementById('modalOverlay');
    const profileModal = document.getElementById('profileModal');
    const logoutBtn = document.getElementById('logoutBtn');

    function toggleModal() {
        console.log('toggleModal ejecutado');
        modalOverlay.classList.toggle('active');
        profileModal.classList.toggle('active');
    }

    // Abrir modal
    if (iconoPerfil) {
        iconoPerfil.addEventListener('click', function (e) {
            e.stopPropagation();
            toggleModal();
        });
    }

    // Cerrar al hacer clic fuera
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function () {
            toggleModal();
        });
    }

    // Cerrar con ESC
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && profileModal.classList.contains('active')) {
            toggleModal();
        }
    });

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            window.location.href = '/salida';
        });
    }

  // Cargar datos del usuario activo
async function cargarDatosUsuario() {
    try {
        const response = await fetch('/api/usuario/detalle', { credentials: 'include' });
        if (response.ok) {
            const userData = await response.json();
            
            const userNameElement = document.querySelector('.user-name');
            const userEmailElement = document.querySelector('.user-email');
            const userProfilePic = document.getElementById('userProfilePic');
            
            if (userNameElement) {
                userNameElement.textContent = `${userData.nombres} ${userData.apellidopat} ${userData.apellidomat}`;
            }
            
            if (userEmailElement) {
                userEmailElement.textContent = userData.correo;
            }
            
            if (userProfilePic && userData.imagen_perfil) {
                userProfilePic.src = `/showImage/${userData.imagen_perfil}`;
            }
        } else {
            console.warn('Usuario no activo o no encontrado');
        }
    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
    }
}

cargarDatosUsuario();

});



