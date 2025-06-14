document.querySelector('.boton-crear').addEventListener('click', function() {
    window.location.href = '/agregar-producto';
});

document.addEventListener('DOMContentLoaded', function () {
    
    // ========== MODAL DE USUARIO ==========
    const iconoPerfil = document.querySelector('.icono-perfil');
    const modalOverlay = document.getElementById('modalOverlay');
    const profileModal = document.getElementById('profileModal');
    const logoutBtn = document.getElementById('logoutBtn');

    // Mostrar/ocultar modal
    function toggleModal() {
        modalOverlay.classList.toggle('active');
        profileModal.classList.toggle('active');
    }

    // Event listeners
    if (iconoPerfil) {
        iconoPerfil.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleModal();
        });
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', function() {
            toggleModal();
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            window.location.href = '/salida';
        });
    }

    // Cerrar con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && profileModal.classList.contains('active')) {
            toggleModal();
        }
    });

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


    // Paginación
    const filasPorPagina = 15;
    let paginaActual = 1;
    let datosPublicaciones = [];
    const cuerpoTabla = document.getElementById('cuerpo-tabla');
    const btnAnterior = document.getElementById('btn-anterior');
    const btnSiguiente = document.getElementById('btn-siguiente');
    const infoPagina = document.getElementById('info-pagina');

    //Modal de filtros
    const modalFiltros = document.getElementById('modal-filtros');
    const botonFiltrar = document.querySelector('.boton-filtrar');
    const cerrarModal = document.querySelector('.cerrar-modal');
    const botonAplicarFiltros = document.getElementById('aplicar-filtros');
    const filtroPlantel = document.getElementById('filtro-plantel');
    const filtroCatalogo = document.getElementById('filtro-catalogo');
    const fechaInicioInput = document.getElementById('fecha-inicio');
    const fechaFinInput = document.getElementById('fecha-fin');

    function formatDate(date) {
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    }

    async function obtenerDatos(filtros = {}) {
        try {
            const usuarioResponse = await fetch('/api/usuario/actual', { credentials: 'include' });
            if (!usuarioResponse.ok) throw new Error('No se pudo obtener el ID del usuario');
            
            const usuarioData = await usuarioResponse.json();
            const usuarioId = usuarioData.usuarioId;
            
            const queryParams = new URLSearchParams();
            
            if (filtros.fechaInicio) queryParams.append('fechaInicio', filtros.fechaInicio);
            if (filtros.fechaFin) queryParams.append('fechaFin', filtros.fechaFin);
            if (filtros.plantelId) queryParams.append('plantelId', filtros.plantelId);
            if (filtros.categoriaId) queryParams.append('categoriaId', filtros.categoriaId); 
    
            const response = await fetch(`/api/publicaciones/${usuarioId}?${queryParams.toString()}`, {
                credentials: 'include'
            });
            
            if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
            
            datosPublicaciones = await response.json();
            mostrarDatos(paginaActual);
        } catch (error) {
            console.error('Error al obtener datos:', error);
            cuerpoTabla.innerHTML = `<tr><td colspan="8">Error: ${error.message}</td></tr>`;
        }
    }

    function mostrarDatos(pagina) {
        cuerpoTabla.innerHTML = '';
    
        if (datosPublicaciones.length === 0) {
            cuerpoTabla.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 20px;">
                        No se encontraron publicaciones con los filtros aplicados.
                    </td>
                </tr>
            `;
            infoPagina.textContent = 'Página 0 de 0';
            btnAnterior.disabled = true;
            btnSiguiente.disabled = true;
            return;
        }
    
        const inicio = (pagina - 1) * filasPorPagina;
        const fin = inicio + filasPorPagina;
        const datosPagina = datosPublicaciones.slice(inicio, fin);
    
        datosPagina.forEach((publicacion, index) => {
            const fila = document.createElement('tr');
            fila.setAttribute('data-id', publicacion.id);
    
            // Formatear la fecha para mostrar solo YYYY-MM-DD
            const fechaFormateada = publicacion.fecha.split('T')[0];
    
            fila.innerHTML = `
                <td>${inicio + index + 1}</td>
                <td>${publicacion.producto}</td>
                <td>${publicacion.plantel}</td>
                <td>${publicacion.catalogo}</td>
                <td>${publicacion.cantidad}</td>
                <td>${publicacion.costo}</td>
                <td>${fechaFormateada}</td> <!-- Fecha formateada -->
                <td>
                    <img src="/editar.png" alt="Editar" class="icono-accion editar" data-id="${publicacion.id}">
                </td>
                <td>
                    <img src="/eliminar.png" alt="Eliminar" class="icono-accion eliminar" data-id="${publicacion.id}">
                </td>
            `;
    
            cuerpoTabla.appendChild(fila);
        });
    
        const totalPaginas = Math.ceil(datosPublicaciones.length / filasPorPagina);
        infoPagina.textContent = `Página ${pagina} de ${totalPaginas}`;
    
        btnAnterior.disabled = pagina === 1;
        btnSiguiente.disabled = pagina === totalPaginas || totalPaginas === 0;
    
        agregarEventosAcciones();
    }

    async function eliminarPublicacion(id) {
        try {
            const response = await fetch(`/api/publicaciones/${id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al eliminar la publicación');
            }
            
            const result = await response.json();
            alert(result.message);
            
            datosPublicaciones = datosPublicaciones.filter(pub => pub.id != id);
            
            const totalPaginas = Math.ceil(datosPublicaciones.length / filasPorPagina);
            if (paginaActual > totalPaginas && totalPaginas > 0) {
                paginaActual = totalPaginas;
            }
            
            mostrarDatos(paginaActual);
        } catch (error) {
            console.error('Error al eliminar publicación:', error);
            alert('Error al eliminar la publicación: ' + error.message);
        }
    }

    function agregarEventosAcciones() {
        const botonesEditar = document.querySelectorAll('.editar');
        const botonesEliminar = document.querySelectorAll('.eliminar');

        botonesEditar.forEach(boton => {
            boton.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                console.log(`Editar publicación con ID: ${id}`);
                window.location.href = `/editar-producto?id=${id}`;
            });
        });

        botonesEliminar.forEach(boton => {
            boton.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                if (confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
                    eliminarPublicacion(id);
                }
            });
        });
    }

    async function cargarPlanteles() {
        try {
            const response = await fetch('http://localhost:3001/api/planteles', {
                credentials: 'include' 
            });
    
            if (!response.ok) throw new Error('Error al cargar planteles');
    
            const planteles = await response.json();
    
            filtroPlantel.innerHTML = '<option value="">Selecciona un plantel</option>';
            planteles.forEach(plantel => {
                const option = document.createElement('option');
                option.value = plantel.plantel_id;
                option.textContent = plantel.nombre;
                filtroPlantel.appendChild(option);
            });
    
        } catch (error) {
            console.error('Error al cargar planteles:', error);
        }
    }
    

    async function cargarCategorias(plantelId) {
        try {
            filtroCatalogo.innerHTML = '<option value="">Selecciona un catálogo</option>';
            
            if (!plantelId) {
                filtroCatalogo.disabled = true;
                return;
            }
    
            const response = await fetch(`http://localhost:3001/api/categorias?plantelId=${plantelId}`);
            if (!response.ok) throw new Error('Error al cargar categorías');
            
            const categorias = await response.json();
            
            categorias.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria.categoria_id;
                option.textContent = categoria.nombre;
                filtroCatalogo.appendChild(option);
            });
            
            filtroCatalogo.disabled = false;
        } catch (error) {
            console.error('Error al cargar categorías:', error);
            filtroCatalogo.innerHTML = '<option value="">Error al cargar catálogos</option>';
        }
    }

    filtroPlantel.addEventListener('change', function() {
        filtroCatalogo.value = "";
        cargarCategorias(this.value);
    });

    document.querySelectorAll('.fecha-rapida button').forEach(boton => {
        boton.addEventListener('click', function() {
            const tipo = this.getAttribute('data-tipo');
            const hoy = new Date();
            
            switch(tipo) {
                case 'hoy':
                    fechaInicioInput.value = formatDate(hoy);
                    fechaFinInput.value = formatDate(hoy);
                    break;
                case 'semana':
                    const inicioSemana = new Date(hoy);
                    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
                    const finSemana = new Date(hoy);
                    finSemana.setDate(hoy.getDate() + (6 - hoy.getDay()));
                    
                    fechaInicioInput.value = formatDate(inicioSemana);
                    fechaFinInput.value = formatDate(finSemana);
                    break;
                case 'mes':
                    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
                    
                    fechaInicioInput.value = formatDate(inicioMes);
                    fechaFinInput.value = formatDate(finMes);
                    break;
            }
        });
    });

    document.getElementById('reiniciar-fechas').addEventListener('click', function() {
        fechaInicioInput.value = '';
        fechaFinInput.value = '';
    });

    document.getElementById('reiniciar-plantel').addEventListener('click', function() {
        filtroPlantel.value = '';
        filtroCatalogo.innerHTML = '<option value="">Selecciona un catálogo</option>';
        filtroCatalogo.disabled = true;
    });

    document.getElementById('reiniciar-catalogo').addEventListener('click', function() {
        filtroCatalogo.value = '';
    });

    // Mostrar/ocultar modal
    botonFiltrar.addEventListener('click', function() {
        modalFiltros.style.display = 'flex';
    });

    cerrarModal.addEventListener('click', function() {
        modalFiltros.style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        if (event.target === modalFiltros) {
            modalFiltros.style.display = 'none';
        }
    });

botonAplicarFiltros.addEventListener('click', function() {
    const fechaInicio = fechaInicioInput.value;
    const fechaFin = fechaFinInput.value;
    const plantelId = filtroPlantel.value;
    const categoriaId = filtroCatalogo.value;
    
    const filtros = {};
    
    if (fechaInicio) filtros.fechaInicio = fechaInicio;
    if (fechaFin) filtros.fechaFin = fechaFin;
    if (plantelId) filtros.plantelId = plantelId;
    if (categoriaId && categoriaId !== "") filtros.categoriaId = categoriaId;
    
    paginaActual = 1;
    obtenerDatos(filtros);
    modalFiltros.style.display = 'none';
});

    btnAnterior.addEventListener('click', () => {
        if (paginaActual > 1) {
            paginaActual--;
            mostrarDatos(paginaActual);
        }
    });

    btnSiguiente.addEventListener('click', () => {
        const totalPaginas = Math.ceil(datosPublicaciones.length / filasPorPagina);
        if (paginaActual < totalPaginas) {
            paginaActual++;
            mostrarDatos(paginaActual);
        }
    });

    cargarPlanteles();
    obtenerDatos();
});
